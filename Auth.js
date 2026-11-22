
import { useState } from 'react';
import axios from 'axios';

function Auth({ onBack, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'register';

      const response = await axios.post(
        `http://localhost:5000/api/auth/${endpoint}`,
        isLogin
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password }
      );

      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );

        onLoginSuccess(response.data.user);
      } else {
        setMessage('Registration successful! You can now log in.');
        setIsLogin(true);
        setName('');
        setPassword('');
      }

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">

        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>

        <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>

        <p>
          {isLogin
            ? 'Login to continue shopping.'
            : 'Register to start shopping with us.'}
        </p>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => setEmail(e.target.value.trim())}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin ? 'Login' : 'Register'}
          </button>

        </form>

        {message && <p>{message}</p>}

        <p className="auth-toggle">
          {isLogin
            ? "Don't have an account?"
            : 'Already have an account?'}

          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
          >
            {isLogin ? ' Register' : ' Login'}
          </span>
        </p>

      </div>
    </div>
  );
}

export default Auth;
