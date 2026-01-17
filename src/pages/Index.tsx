import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

type Tab = 'chats' | 'search' | 'channels' | 'calls' | 'settings' | 'profile';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

const mockChats: Chat[] = [
  { id: '1', name: 'Анна Петрова', avatar: '', lastMessage: 'Привет! Как дела?', time: '12:45', unread: 3, online: true },
  { id: '2', name: 'Команда OfChat', avatar: '', lastMessage: 'Новое обновление доступно', time: '11:30', unread: 0, online: false },
  { id: '3', name: 'Алексей Иванов', avatar: '', lastMessage: 'Отправил файл', time: 'Вчера', unread: 1, online: true },
  { id: '4', name: 'Марина Сидорова', avatar: '', lastMessage: 'Спасибо за помощь!', time: 'Вчера', unread: 0, online: false },
];

const mockChannels = [
  { id: 'c1', name: 'Новости OfChat', avatar: '', subscribers: '12.5K', description: 'Официальный канал новостей' },
  { id: 'c2', name: 'Технологии', avatar: '', subscribers: '8.3K', description: 'Всё о технологиях' },
  { id: 'c3', name: 'Дизайн', avatar: '', subscribers: '5.1K', description: 'UI/UX и графика' },
];

const mockCalls = [
  { id: 'call1', name: 'Анна Петрова', type: 'incoming', duration: '5:23', time: 'Сегодня 14:30', avatar: '' },
  { id: 'call2', name: 'Алексей Иванов', type: 'outgoing', duration: '12:45', time: 'Вчера 18:15', avatar: '' },
  { id: 'call3', name: 'Марина Сидорова', type: 'missed', duration: '', time: '2 дня назад', avatar: '' },
];

interface IndexProps {
  user: any;
  onLogout: () => void;
}

const Index = ({ user, onLogout }: IndexProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Привет! Как дела?', sender: 'other', time: '12:40' },
    { id: '2', text: 'Отлично! А у тебя?', sender: 'me', time: '12:42' },
    { id: '3', text: 'Тоже хорошо, хотел спросить про проект', sender: 'other', time: '12:45' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
  };

  const navItems = [
    { id: 'chats' as Tab, icon: 'MessageCircle', label: 'Чаты' },
    { id: 'search' as Tab, icon: 'Search', label: 'Поиск' },
    { id: 'channels' as Tab, icon: 'Radio', label: 'Каналы' },
    { id: 'calls' as Tab, icon: 'Phone', label: 'Звонки' },
    { id: 'profile' as Tab, icon: 'User', label: 'Профиль' },
    { id: 'settings' as Tab, icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6 gap-6">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-xl">
          OF
        </div>
        
        <div className="flex-1 flex flex-col gap-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                activeTab === item.id 
                  ? 'gradient-primary text-white shadow-lg' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon name={item.icon} size={24} />
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-popover text-popover-foreground rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-2xl font-bold mb-4">
            {activeTab === 'chats' && 'Чаты'}
            {activeTab === 'search' && 'Поиск'}
            {activeTab === 'channels' && 'Каналы'}
            {activeTab === 'calls' && 'Звонки'}
            {activeTab === 'profile' && 'Профиль'}
            {activeTab === 'settings' && 'Настройки'}
          </h2>
          <Input 
            placeholder={activeTab === 'search' ? 'Искать по ID или имени...' : 'Поиск...'} 
            className="bg-muted border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1">
          {activeTab === 'chats' && (
            <div className="p-2">
              {mockChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-3 rounded-xl mb-2 transition-all duration-200 hover:bg-muted text-left ${
                    selectedChat?.id === chat.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback className="gradient-primary text-white">
                          {chat.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent rounded-full border-2 border-card animate-pulse-glow" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold truncate">{chat.name}</span>
                        <span className="text-xs text-muted-foreground">{chat.time}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">{chat.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="p-4 space-y-4">
              <div className="text-center py-8">
                <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Введите ID или имя пользователя</p>
                <p className="text-sm text-muted-foreground mt-2">Например: @username или #12345</p>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="p-2">
              {mockChannels.map((channel) => (
                <div key={channel.id} className="p-4 rounded-xl mb-2 hover:bg-muted transition-all duration-200 cursor-pointer">
                  <div className="flex gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="gradient-accent text-white">
                        {channel.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{channel.name}</div>
                      <div className="text-sm text-muted-foreground">{channel.subscribers} подписчиков</div>
                      <div className="text-xs text-muted-foreground mt-1">{channel.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="p-2">
              {mockCalls.map((call) => (
                <div key={call.id} className="p-4 rounded-xl mb-2 hover:bg-muted transition-all duration-200">
                  <div className="flex gap-3 items-center">
                    <Avatar>
                      <AvatarFallback className="gradient-primary text-white">
                        {call.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{call.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon 
                          name={call.type === 'incoming' ? 'PhoneIncoming' : call.type === 'outgoing' ? 'PhoneOutgoing' : 'PhoneMissed'} 
                          size={14} 
                          className={call.type === 'missed' ? 'text-destructive' : ''} 
                        />
                        <span>{call.time}</span>
                        {call.duration && <span>• {call.duration}</span>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="text-accent">
                      <Icon name="Phone" size={20} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarFallback className="gradient-primary text-white text-3xl">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{user.username}</h3>
                <p className="text-muted-foreground">@{user.username}</p>
                <Badge className="mt-2 gradient-primary text-white border-0">ID: #{user.unique_id}</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-xl">
                  <div className="text-sm text-muted-foreground">Имя пользователя</div>
                  <div className="font-semibold">{user.username}</div>
                </div>
                {user.email && (
                  <div className="p-4 bg-muted rounded-xl">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-semibold">{user.email}</div>
                  </div>
                )}
                {user.phone && (
                  <div className="p-4 bg-muted rounded-xl">
                    <div className="text-sm text-muted-foreground">Телефон</div>
                    <div className="font-semibold">{user.phone}</div>
                  </div>
                )}
              </div>

              <Button 
                onClick={onLogout}
                variant="outline"
                className="w-full"
              >
                <Icon name="LogOut" className="mr-2 h-4 w-4" />
                Выйти из аккаунта
              </Button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4 space-y-2">
              {['Уведомления', 'Конфиденциальность', 'Безопасность', 'Данные и хранилище', 'Чаты', 'Язык', 'О программе'].map((setting) => (
                <button
                  key={setting}
                  className="w-full p-4 rounded-xl hover:bg-muted transition-all duration-200 flex justify-between items-center text-left"
                >
                  <span>{setting}</span>
                  <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-background">
        {selectedChat && activeTab === 'chats' ? (
          <>
            <div className="p-4 border-b border-border bg-card flex items-center gap-4">
              <Avatar>
                <AvatarImage src={selectedChat.avatar} />
                <AvatarFallback className="gradient-primary text-white">
                  {selectedChat.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold">{selectedChat.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedChat.online ? 'В сети' : 'Был(а) недавно'}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="text-accent">
                <Icon name="Phone" size={20} />
              </Button>
              <Button size="icon" variant="ghost" className="text-accent">
                <Icon name="Video" size={20} />
              </Button>
              <Button size="icon" variant="ghost">
                <Icon name="MoreVertical" size={20} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-2xl ${
                        message.sender === 'me'
                          ? 'gradient-primary text-white rounded-br-md'
                          : 'bg-card text-foreground rounded-bl-md'
                      }`}
                    >
                      <p>{message.text}</p>
                      <span className={`text-xs mt-1 block ${
                        message.sender === 'me' ? 'text-white/70' : 'text-muted-foreground'
                      }`}>
                        {message.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Button size="icon" variant="ghost">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  className="flex-1 bg-muted border-0"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button size="icon" variant="ghost">
                  <Icon name="Smile" size={20} />
                </Button>
                <Button 
                  onClick={sendMessage}
                  className="gradient-primary text-white border-0 hover:opacity-90"
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center text-white text-5xl font-bold">
                OF
              </div>
              <h2 className="text-3xl font-bold mb-2">Добро пожаловать в OfChat</h2>
              <p className="text-muted-foreground">
                {activeTab === 'chats' && 'Выберите чат, чтобы начать общение'}
                {activeTab === 'search' && 'Найдите друзей по ID или имени'}
                {activeTab === 'channels' && 'Подпишитесь на интересные каналы'}
                {activeTab === 'calls' && 'Совершайте голосовые и видео звонки'}
                {activeTab === 'profile' && 'Настройте свой профиль'}
                {activeTab === 'settings' && 'Настройте приложение под себя'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;