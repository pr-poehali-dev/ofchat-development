import json
import os
import random
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для отправки и проверки SMS-кодов подтверждения'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    
    if method == 'POST' and action == 'send':
        return send_verification_code(event, dsn)
    elif method == 'POST' and action == 'verify':
        return verify_code(event, dsn)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'OfChat SMS Verification API'}),
        'isBase64Encoded': False
    }

def generate_code() -> str:
    return str(random.randint(100000, 999999))

def send_verification_code(event: dict, dsn: str) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        phone = body.get('phone', '').strip()
        
        if not phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone number is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT COUNT(*) as count FROM verification_codes WHERE phone = %s AND created_at > NOW() - INTERVAL '1 minute'",
            (phone,)
        )
        recent_codes = cursor.fetchone()
        
        if recent_codes and recent_codes['count'] > 0:
            cursor.close()
            conn.close()
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Please wait before requesting a new code'}),
                'isBase64Encoded': False
            }
        
        code = generate_code()
        expires_at = datetime.now() + timedelta(minutes=5)
        
        cursor.execute(
            "INSERT INTO verification_codes (phone, code, expires_at) VALUES (%s, %s, %s) RETURNING id",
            (phone, code, expires_at)
        )
        
        verification_id = cursor.fetchone()['id']
        conn.commit()
        
        cursor.close()
        conn.close()
        
        print(f"SMS Code for {phone}: {code}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Verification code sent to {phone}',
                'verification_id': verification_id,
                'dev_code': code
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def verify_code(event: dict, dsn: str) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        phone = body.get('phone', '').strip()
        code = body.get('code', '').strip()
        
        if not phone or not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone and code are required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT id, code, expires_at, verified, attempts FROM verification_codes WHERE phone = %s AND verified = false ORDER BY created_at DESC LIMIT 1",
            (phone,)
        )
        
        verification = cursor.fetchone()
        
        if not verification:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No verification code found'}),
                'isBase64Encoded': False
            }
        
        if verification['attempts'] >= 3:
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Too many attempts. Request a new code'}),
                'isBase64Encoded': False
            }
        
        if datetime.now() > verification['expires_at']:
            cursor.close()
            conn.close()
            return {
                'statusCode': 410,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Verification code expired'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "UPDATE verification_codes SET attempts = attempts + 1 WHERE id = %s",
            (verification['id'],)
        )
        
        if verification['code'] != code:
            conn.commit()
            cursor.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid verification code'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "UPDATE verification_codes SET verified = true WHERE id = %s",
            (verification['id'],)
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Phone number verified successfully'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
