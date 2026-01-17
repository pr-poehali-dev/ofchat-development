import json
import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для регистрации и авторизации пользователей OfChat'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token'
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
    
    if method == 'POST' and action == 'register':
        return register_user(event, dsn)
    elif method == 'POST' and action == 'login':
        return login_user(event, dsn)
    elif method == 'GET' and action == 'profile':
        return get_profile(event, dsn)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'OfChat Auth API', 'endpoints': ['/register', '/login', '/profile']}),
        'isBase64Encoded': False
    }

def generate_unique_id() -> str:
    return secrets.token_hex(5).upper()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(event: dict, dsn: str) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username', '').strip()
        email = body.get('email', '').strip()
        phone = body.get('phone', '').strip()
        password = body.get('password', '').strip()
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username and password are required'}),
                'isBase64Encoded': False
            }
        
        if not email and not phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email or phone is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        unique_id = generate_unique_id()
        password_hash = hash_password(password)
        
        cursor.execute(
            "INSERT INTO users (unique_id, username, email, phone, password_hash) VALUES (%s, %s, %s, %s, %s) RETURNING id, unique_id, username, email, phone, created_at",
            (unique_id, username, email if email else None, phone if phone else None, password_hash)
        )
        
        user = dict(cursor.fetchone())
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': user['id'],
                    'unique_id': user['unique_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'phone': user['phone']
                }
            }, default=str),
            'isBase64Encoded': False
        }
        
    except psycopg2.IntegrityError as e:
        if conn:
            conn.rollback()
            conn.close()
        
        error_msg = str(e)
        if 'username' in error_msg:
            msg = 'Username already exists'
        elif 'email' in error_msg:
            msg = 'Email already registered'
        elif 'phone' in error_msg:
            msg = 'Phone already registered'
        else:
            msg = 'Registration failed'
        
        return {
            'statusCode': 409,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': msg}),
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

def login_user(event: dict, dsn: str) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        identifier = body.get('identifier', '').strip()
        password = body.get('password', '').strip()
        
        if not identifier or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Identifier and password are required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        password_hash = hash_password(password)
        
        cursor.execute(
            "SELECT id, unique_id, username, email, phone, avatar_url, bio FROM users WHERE (username = %s OR email = %s OR phone = %s) AND password_hash = %s",
            (identifier, identifier, identifier, password_hash)
        )
        
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = %s",
            (user['id'],)
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': dict(user)
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

def get_profile(event: dict, dsn: str) -> dict:
    try:
        user_id = event.get('queryStringParameters', {}).get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User ID is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT id, unique_id, username, email, phone, avatar_url, bio, is_online, last_seen FROM users WHERE id = %s",
            (user_id,)
        )
        
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'user': dict(user)}, default=str),
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