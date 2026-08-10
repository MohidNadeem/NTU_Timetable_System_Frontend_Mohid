import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
    const { user, markPasswordChanged, logout } = useAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // guarding against direct navigation here without being logged in first
    if (!user) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // checking client-side first so we don't bother the backend on a typo
        if (newPassword !== confirmPassword) {
            setError("New password and confirmation don't match");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            // updating context so mustChangePassword flips false and route guards stop redirecting here
            markPasswordChanged();
            navigate(user.role === 'LECTURER' ? '/lecturer' : '/timetabling-team');
        } catch (err) {
            setError(err.message || 'Could not change password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <span className="auth-card__crest">NTU</span>
                <h1 className="auth-card__title">Set a new password</h1>
                <p className="auth-card__subtitle">
                    This is your first login, {user.fullName}. Please set a password only you know before continuing.
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="field">
                        <span className="field__label">Current (temporary) password</span>
                        <input
                            className="field__input"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </label>

                    <label className="field">
                        <span className="field__label">New password</span>
                        <input
                            className="field__input"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </label>

                    <label className="field">
                        <span className="field__label">Confirm new password</span>
                        <input
                            className="field__input"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </label>

                    {error && <p className="field__error">{error}</p>}

                    <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save and continue'}
                    </button>
                    <button
                        type="button"
                        className="btn btn--ghost btn--full"
                        onClick={() => { logout(); navigate('/login'); }}
                    >
                        Log out instead
                    </button>
                </form>
            </div>
        </div>
    );
}