import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/8ce76019-d4a6-4155-bfdc-4d86a24a7b20';
const SMS_API_URL = 'https://functions.poehali.dev/0a6d2e85-1152-44d1-8759-47ed662d96fb';

interface AuthProps {
  onSuccess: (user: any) => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [verificationStep, setVerificationStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });

  const sendVerificationCode = async () => {
    if (!registerData.phone) {
      toast({
        title: 'Ошибка',
        description: 'Укажите номер телефона',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${SMS_API_URL}?action=send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: registerData.phone
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSentCode(data.dev_code);
        setVerificationStep('verify');
        toast({
          title: 'Код отправлен!',
          description: `SMS отправлено на ${registerData.phone}. DEV код: ${data.dev_code}`
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (!verificationCode) {
      toast({
        title: 'Ошибка',
        description: 'Введите код подтверждения',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const verifyResponse = await fetch(`${SMS_API_URL}?action=verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: registerData.phone,
          code: verificationCode
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        toast({
          title: 'Неверный код',
          description: verifyData.error || 'Проверьте код и попробуйте снова',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}?action=register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email || undefined,
          phone: registerData.phone || undefined,
          password: registerData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Успешно!',
          description: `Добро пожаловать, ${data.user.username}! Ваш ID: ${data.user.unique_id}`
        });
        onSuccess(data.user);
      } else {
        toast({
          title: 'Ошибка регистрации',
          description: data.error || 'Не удалось зарегистрироваться',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }

    if (!registerData.phone) {
      toast({
        title: 'Ошибка',
        description: 'Укажите номер телефона для регистрации',
        variant: 'destructive'
      });
      return;
    }

    await sendVerificationCode();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Успешно!',
          description: `С возвращением, ${data.user.username}!`
        });
        onSuccess(data.user);
      } else {
        toast({
          title: 'Ошибка входа',
          description: data.error || 'Неверные данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl gradient-primary flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            OF
          </div>
          <h1 className="text-4xl font-bold mb-2">OfChat</h1>
          <p className="text-muted-foreground">Современный мессенджер для общения</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Добро пожаловать</CardTitle>
            <CardDescription>Войдите или создайте новый аккаунт</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">Email, телефон или логин</Label>
                    <Input
                      id="login-identifier"
                      placeholder="user@example.com или +79991234567"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Введите пароль"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-white border-0 hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      <>
                        <Icon name="LogIn" className="mr-2 h-4 w-4" />
                        Войти
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                {verificationStep === 'form' ? (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Имя пользователя</Label>
                      <Input
                        id="register-username"
                        placeholder="username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email (необязательно)</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="user@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Телефон *</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="+79991234567"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">На этот номер придет SMS с кодом</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Пароль</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Создайте пароль"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Подтвердите пароль</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="Повторите пароль"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary text-white border-0 hover:opacity-90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                          Отправка кода...
                        </>
                      ) : (
                        <>
                          <Icon name="Send" className="mr-2 h-4 w-4" />
                          Получить код подтверждения
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name="Smartphone" size={32} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Подтвердите номер телефона</h3>
                      <p className="text-sm text-muted-foreground">
                        Мы отправили SMS с кодом на номер<br />
                        <span className="font-semibold">{registerData.phone}</span>
                      </p>
                      {sentCode && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                          DEV код: {sentCode}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Код подтверждения</Label>
                      <Input
                        id="verification-code"
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        disabled={isLoading}
                        className="text-center text-2xl tracking-widest"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setVerificationStep('form');
                          setVerificationCode('');
                        }}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                        Назад
                      </Button>
                      <Button 
                        onClick={verifyAndRegister}
                        className="flex-1 gradient-primary text-white border-0 hover:opacity-90"
                        disabled={isLoading || verificationCode.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                            Проверка...
                          </>
                        ) : (
                          <>
                            <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                            Подтвердить
                          </>
                        )}
                      </Button>
                    </div>

                    <Button 
                      variant="link"
                      onClick={sendVerificationCode}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Отправить код повторно
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Регистрируясь, вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
};

export default Auth;