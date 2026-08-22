import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleHomePath } from '../api/constraintOptions';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      // routing to forced change-password first before letting them reach a dashboard
      if (user.mustChangePassword) {
        navigate('/change-password');
        return;
      }
      navigate(roleHomePath(user.role));
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-card__crest">NTU</span>
        <h1 className="auth-card__title">Timetabling Requests Management</h1>
        <p className="auth-card__subtitle">Sign in with the credentials provided by your admin.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="field__label">Username</span>
            <input
              className="field__input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="field__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="field__error">{error}</p>}

          <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__hint">
          Accounts are provisioned by an admin — there's no self-registration.
          Contact the timetabling team if you don't have login credentials.
        </p>
      </div>

      <Footer />
    </div>
  );
}
