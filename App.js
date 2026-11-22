
import { useState, useEffect } from 'react';
import './App.css';
import Auth from './Auth';

// NAVBAR
function Navbar({
  cartCount,
  user,
  onLoginClick,
  onOrdersClick,
  onLogout
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="navbar">
      <h2>ShopEase</h2>

      <div className="nav-links">
        <a href="#home">Home</a>
        <a href="#products">Products</a>
        <a href="#cart">Cart ({cartCount})</a>
        <button onClick={onOrdersClick}>My Orders</button>
      </div>

      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            className="login-btn"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            👤 {user.name?.split(' ')[0] || 'Profile'}
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '45px',
                width: '220px',
                zIndex: 100,
                background: 'white',
                color: '#222',
                padding: '15px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px'
              }}
            >
              <h3>My Profile</h3>
              <p>{user.name}</p>
              <p>{user.email}</p>

              <button
                className="remove-btn"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className="login-btn" onClick={onLoginClick}>
          Login
        </button>
      )}
    </nav>
  );
}

// PRODUCT CARD
function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />

      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <h3>₹{product.price}</h3>

        <button
          className="add-btn"
          onClick={() => onAddToCart(product)}
          disabled={product.stock <= 0}
        >
          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

// MAIN APP
function App() {
  const [cart, setCart] = useState([]);

  const [showAuth, setShowAuth] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const [paymentLoading, setPaymentLoading] = useState('');
  const [paymentMethods, setPaymentMethods] = useState({});

  // FETCH PRODUCTS
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(
          'http://localhost:5000/api/products'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch products.');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('Unable to load products.');
        }

        setProducts(
          data.products.map((product) => ({
            ...product,
            id: product._id
          }))
        );
      } catch (err) {
        console.error(err);
        setError('Unable to load products. Check your backend.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // LOGIN SUCCESS
  function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);
    setShowAuth(false);
    setShowOrders(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setShowOrders(false);
    setShowAuth(false);
    setOrderMessage('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // FETCH MY ORDERS
  async function fetchMyOrders() {
    const token = localStorage.getItem('token');

    if (!token) {
      setOrdersError('Please login to view your orders.');
      setOrders([]);
      return;
    }

    try {
      setOrdersLoading(true);
      setOrdersError('');

      const response = await fetch(
        'http://localhost:5000/api/orders/my-orders',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch orders.');
      }

      setOrders(data.orders || []);
    } catch (err) {
      setOrdersError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  }

  // OPEN MY ORDERS
  function openMyOrders() {
    setShowOrders(true);
    setShowAuth(false);
    fetchMyOrders();
  }

  // ADD TO CART
  function addToCart(product) {
    setOrderMessage('');

    setCart((prevCart) => {
      const existingProduct = prevCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        if (existingProduct.quantity >= product.stock) {
          setOrderMessage('Maximum available stock reached.');
          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  }

  // UPDATE QUANTITY
  function updateQuantity(id, change) {
    setOrderMessage('');

    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id !== id) return item;

          const newQuantity = item.quantity + change;

          if (newQuantity > item.stock) {
            setOrderMessage('Maximum available stock reached.');
            return item;
          }

          return { ...item, quantity: newQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  // REMOVE FROM CART
  function removeFromCart(id) {
    setOrderMessage('');

    setCart((prevCart) =>
      prevCart.filter((item) => item.id !== id)
    );
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // CHECKOUT / PLACE ORDER
  async function handleCheckout() {
    const token = localStorage.getItem('token');

    if (!token) {
      setOrderMessage('Please login before placing an order.');
      setShowAuth(true);
      return;
    }

    if (cart.length === 0) {
      setOrderMessage('Your cart is empty.');
      return;
    }

    try {
      setOrderLoading(true);
      setOrderMessage('');

      const response = await fetch(
        'http://localhost:5000/api/orders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.id,
              quantity: item.quantity
            }))
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
        }

        throw new Error(data.message || 'Order placement failed.');
      }

      setCart([]);

      setOrderMessage(
        `Order placed successfully! Order ID: ${data.order._id}. Payment status: ${data.order.paymentStatus}.`
      );

      if (showOrders) {
        await fetchMyOrders();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setOrderMessage(err.message);
    } finally {
      setOrderLoading(false);
    }
  }

  // PAYMENT
  async function handlePayment(orderId, method) {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login first.');
      return;
    }

    try {
      setPaymentLoading(orderId);

      const response = await fetch(
        `http://localhost:5000/api/payments/${orderId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ method })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed.');
      }

      alert(data.message);
      await fetchMyOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentLoading('');
    }
  }

// CANCEL ORDER
async function handleCancelOrder(orderId) {
  const confirmCancel = window.confirm(
    'Are you sure you want to cancel this order?'
  );

  if (!confirmCancel) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/cancel`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to cancel order.');
    }

    alert(data.message);
    await fetchMyOrders();

  } catch (error) {
    alert(error.message);
  }
}
  // AUTHENTICATION SCREEN
  if (showAuth) {
    return (
      <Auth
        onBack={() => setShowAuth(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div>
      <Navbar
        cartCount={cartCount}
        user={user}
        onLoginClick={() => setShowAuth(true)}
        onOrdersClick={openMyOrders}
        onLogout={handleLogout}
      />

      {showOrders ? (
        // MY ORDERS
        <section className="cart-section">
          <h2>My Orders</h2>

          <button
            className="shop-btn"
            onClick={() => setShowOrders(false)}
          >
            Back to Shopping
          </button>

          {ordersLoading ? (
            <p>Loading your orders...</p>
          ) : ordersError ? (
            <p>{ordersError}</p>
          ) : orders.length === 0 ? (
            <p>You have not placed any orders yet.</p>
          ) : (
            <div>
              {orders.map((order) => (
                <div className="cart-item" key={order._id}>
                  <div>
                    <h3>Order ID: {order._id}</h3>

                    <p>
                      Date: {new Date(order.createdAt).toLocaleString()}
                    </p>

                    {order.items.map((item, index) => (
                      <p key={index}>
                        {item.name} × {item.quantity} — ₹
                        {item.price * item.quantity}
                      </p>
                    ))}

                    <h3>Total: ₹{order.totalAmount}</h3>

                    <p>Payment Status: {order.paymentStatus}</p>
                    <p>Order Status: {order.orderStatus}</p>

{order.paymentStatus !== 'Paid' &&
  ['Placed', 'Processing'].includes(order.orderStatus) && (
    <button
      className="remove-btn"
      onClick={() => handleCancelOrder(order._id)}
    >
      Cancel Order
    </button>
  )}


                    {order.paymentStatus !== 'Paid' && (
                      <div>
                        <select
                          value={paymentMethods[order._id] || 'UPI'}
                          onChange={(e) =>
                            setPaymentMethods((prev) => ({
                              ...prev,
                              [order._id]: e.target.value
                            }))
                          }
                          style={{
                            padding: '10px',
                            margin: '10px 0'
                          }}
                        >
                          <option value="UPI">UPI</option>
                          <option value="Card">
                            Credit/Debit Card
                          </option>
                          <option value="Cash on Delivery">
                            Cash on Delivery
                          </option>
                        </select>

                        <br />

                        <button
                          className="shop-btn"
                          disabled={paymentLoading === order._id}
                          onClick={() =>
                            handlePayment(
                              order._id,
                              paymentMethods[order._id] || 'UPI'
                            )
                          }
                        >
                          {paymentLoading === order._id
                            ? 'Processing...'
                            : 'Pay Now / Confirm Order'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* HOME */}
          <section className="hero" id="home">
            <div>
              <h1>Discover Your Favourite Products</h1>

              <p>
                Shop the latest trends at the best prices.
                Find everything you need in one place.
              </p>

              <button
                className="shop-btn"
                onClick={() =>
                  document.getElementById('products')?.scrollIntoView({
                    behavior: 'smooth'
                  })
                }
              >
                Shop Now
              </button>
            </div>
          </section>

          {/* FOUR PRODUCTS */}
          <section className="products" id="products">
            <h2>Featured Products</h2>

            {loading ? (
              <p>Loading products...</p>
            ) : error ? (
              <p>{error}</p>
            ) : products.length === 0 ? (
              <p>No products available right now.</p>
            ) : (
              <div className="product-list">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SHOPPING CART */}
          <section className="cart-section" id="cart">
            <h2>Your Shopping Cart</h2>

            {cart.length === 0 ? (
              <p>Your cart is empty. Add some products!</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} />

                      <div>
                        <h3>{item.name}</h3>
                        <p>Price: ₹{item.price}</p>

                        <div className="quantity-controls">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            -
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <h3>₹{item.price * item.quantity}</h3>
                    </div>
                  ))}
                </div>

                <h2>Total: ₹{totalPrice}</h2>

                <button
                  className="shop-btn"
                  onClick={handleCheckout}
                  disabled={orderLoading}
                >
                  {orderLoading
                    ? 'Placing Order...'
                    : 'Proceed to Checkout'}
                </button>
              </>
            )}

            {orderMessage && (
              <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
                {orderMessage}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default App;
