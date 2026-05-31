import { FormEvent, useEffect, useState } from 'react';
import { fetchProfile, updateProfile } from '../utils/backendApi';
import { getAuth, getProfile, setProfile } from '../utils/storage';

export default function Profile() {
  const auth = getAuth();
  const profile = getProfile();
  const [nickname, setNickname] = useState(profile.nickname);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function syncProfile() {
      if (!auth?.token) return;
      try {
        const result = await fetchProfile(auth.token);
        setNickname(result.user.nickname || '匿名同学');
        setProfile({ nickname: result.user.nickname || '匿名同学' });
        window.dispatchEvent(new Event('profile-updated'));
      } catch {
        // Keep local profile visible if the backend is not running during a demo.
      }
    }
    syncProfile();
  }, [auth?.token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = nickname.trim() || '匿名同学';
    setError('');
    setIsSaving(true);
    try {
      if (!auth?.token) {
        throw new Error('缺少登录凭证，请重新登录。');
      }
      const result = await updateProfile(auth.token, next);
      setProfile({ nickname: result.user.nickname });
      setNickname(result.user.nickname);
      setSaved(true);
      window.dispatchEvent(new Event('profile-updated'));
      window.setTimeout(() => setSaved(false), 1800);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : '保存失败。');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="narrow-page">
      <section className="panel">
        <p className="eyebrow">Profile</p>
        <h1>匿名设置</h1>
        <p className="muted">
          聊天页面只显示虚拟昵称，不显示真实邮箱和学号。用户档案保存在后端 SQLite
          数据库中，浏览器 localStorage 只保存登录凭证和展示所需的昵称缓存。
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            虚拟昵称
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? '保存中...' : '保存昵称'}
          </button>
          {error && <div className="form-error">{error}</div>}
          {saved && <div className="success-message">已保存。</div>}
        </form>
      </section>

      <section className="panel secondary-panel">
        <h2>当前后端档案</h2>
        <dl className="profile-list">
          <div>
            <dt>用户 ID</dt>
            <dd>{auth?.userId}</dd>
          </div>
          <div>
            <dt>邮箱</dt>
            <dd>{auth?.email}</dd>
          </div>
          <div>
            <dt>学号</dt>
            <dd>{auth?.studentId}</dd>
          </div>
          <div>
            <dt>聊天展示</dt>
            <dd>{nickname || '匿名同学'}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
