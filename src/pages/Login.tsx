import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BACKEND_BASE_URL, login, signup } from '../utils/api';
import { getAuth, setAuth, setProfile } from '../utils/storage';

function isPkuEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith('@pku.edu.cn') || normalized.endsWith('@stu.pku.edu.cn');
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [nickname, setNickname] = useState('匿名同学');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (getAuth()) {
    return <Navigate to="/home" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!isPkuEmail(email)) {
      setError('邮箱必须以 @pku.edu.cn 或 @stu.pku.edu.cn 结尾。');
      return;
    }
    if (mode === 'signup' && !studentId.trim()) {
      setError('学号不能为空。');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要 6 位。');
      return;
    }

    try {
      setIsSubmitting(true);
      const result =
        mode === 'signup'
          ? await signup({
              email: email.trim(),
              studentId: studentId.trim(),
              password,
              nickname: nickname.trim() || '匿名同学',
            })
          : await login({ email: email.trim(), password });

      setAuth({
        userId: result.user.id,
        email: result.user.email,
        studentId: result.user.studentId,
        token: result.token,
        loginTime: new Date().toISOString(),
      });
      setProfile({ nickname: result.user.nickname || '匿名同学' });
      navigate('/home', { replace: true });
    } catch (apiError) {
      setError(
        `${apiError instanceof Error ? apiError.message : '请求失败。'} 请确认后端已运行：npm run backend（${BACKEND_BASE_URL}）。`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <div className="login-hero">
          <span className="brand-mark">PKU</span>
          <h1>AI 心理健康陪伴与情绪支持系统</h1>
          <p>
            Demo 中仅模拟身份验证。用户档案会通过后端 API 写入本地 SQLite
            数据库，不连接真实北大认证系统。
          </p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="登录与注册切换">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              注册
            </button>
          </div>
          <label>
            北大邮箱
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="demo@stu.pku.edu.cn"
              autoComplete="email"
            />
          </label>
          {mode === 'signup' && (
            <>
              <label>
                学号
                <input
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="2200010000"
                  autoComplete="off"
                />
              </label>
              <label>
                虚拟昵称
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="匿名同学"
                  autoComplete="nickname"
                />
              </label>
            </>
          )}
          <label>
            密码
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : mode === 'signup' ? '注册并进入 Demo' : '登录 Demo'}
          </button>
        </form>
      </section>
    </div>
  );
}
