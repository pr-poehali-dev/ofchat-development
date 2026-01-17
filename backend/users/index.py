import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для поиска пользователей и управления контактами'''
    
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
    
    if method == 'GET' and action == 'search':
        return search_users(event, dsn)
    elif method == 'POST' and action == 'add_contact':
        return add_contact(event, dsn)
    elif method == 'GET' and action == 'contacts':
        return get_contacts(event, dsn)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'OfChat Users API'}),
        'isBase64Encoded': False
    }

def search_users(event: dict, dsn: str) -> dict:
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        search_query = query_params.get('q', '').strip()
        
        if not search_query:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Search query is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if search_query.startswith('#'):
            unique_id = search_query[1:].upper()
            cursor.execute(
                "SELECT id, unique_id, username, avatar_url, bio, is_online FROM users WHERE unique_id = %s",
                (unique_id,)
            )
        elif search_query.startswith('@'):
            username = search_query[1:]
            cursor.execute(
                "SELECT id, unique_id, username, avatar_url, bio, is_online FROM users WHERE username ILIKE %s LIMIT 20",
                (f'%{username}%',)
            )
        else:
            cursor.execute(
                "SELECT id, unique_id, username, avatar_url, bio, is_online FROM users WHERE username ILIKE %s OR unique_id ILIKE %s LIMIT 20",
                (f'%{search_query}%', f'%{search_query}%')
            )
        
        users = [dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'users': users,
                'count': len(users)
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

def add_contact(event: dict, dsn: str) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        contact_user_id = body.get('contact_user_id')
        
        if not user_id or not contact_user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id and contact_user_id are required'}),
                'isBase64Encoded': False
            }
        
        if user_id == contact_user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Cannot add yourself as contact'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "INSERT INTO contacts (user_id, contact_user_id) VALUES (%s, %s) ON CONFLICT (user_id, contact_user_id) DO NOTHING RETURNING id",
            (user_id, contact_user_id)
        )
        
        result = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        if result:
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Contact added successfully'
                }),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Contact already exists'
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

def get_contacts(event: dict, dsn: str) -> dict:
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            """
            SELECT u.id, u.unique_id, u.username, u.avatar_url, u.bio, u.is_online, u.last_seen, c.added_at
            FROM contacts c
            JOIN users u ON c.contact_user_id = u.id
            WHERE c.user_id = %s
            ORDER BY c.added_at DESC
            """,
            (user_id,)
        )
        
        contacts = [dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'contacts': contacts,
                'count': len(contacts)
            }, default=str),
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
