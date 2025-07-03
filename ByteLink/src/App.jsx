import React, { useState, useEffect } from 'react';
import { Link2, Copy, QrCode, BarChart3, Clock, TrendingUp, ExternalLink, Check, AlertCircle } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('shortenedUrls');
    if (stored) {
      const parsed = JSON.parse(stored);
      setShortenedUrls(
        parsed.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }))
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shortenedUrls', JSON.stringify(shortenedUrls));
  }, [shortenedUrls]);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateQRCode = (text) => {
    return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(text)}`;
  };

  const handleShorten = async () => {
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const shortCode = customCode.trim() || generateShortCode();

    if (
      customCode.trim() &&
      shortenedUrls.some((item) => item.shortCode === shortCode)
    ) {
      setError('Custom code already exists. Please choose a different one.');
      setIsLoading(false);
      return;
    }

    const shortUrl = `https://short.ly/${shortCode}`;
    const newUrl = {
      id: Date.now().toString(),
      originalUrl: url,
      shortCode,
      shortUrl,
      createdAt: new Date(),
      clicks: 0,
      qrCode: generateQRCode(shortUrl),
    };

    setShortenedUrls((prev) => [newUrl, ...prev]);
    setUrl('');
    setCustomCode('');
    setIsLoading(false);
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleUrlClick = (id) => {
    setShortenedUrls((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, clicks: item.clicks + 1 } : item
      )
    );
  };

  const totalClicks = shortenedUrls.reduce((sum, url) => sum + url.clicks, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LinkShort
                </h1>
                <p className="text-sm text-gray-600">Professional URL Shortener</p>
              </div>
            </div>

            {shortenedUrls.length > 0 && (
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{shortenedUrls.length} Links</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{totalClicks} Clicks</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Shorten Your Links
            <span className="block text-2xl md:text-3xl font-normal text-gray-600 mt-2">
              Share them anywhere
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create short, memorable links that are perfect for social media, emails, and marketing campaigns.
          </p>
        </div>

        {/* URL Shortening Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6 md:p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your long URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very-long-url-that-needs-shortening"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
                Custom short code (optional)
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-2">short.ly/</span>
                <input
                  type="text"
                  id="customCode"
                  value={customCode}
                  onChange={(e) =>
                    setCustomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
                  }
                  placeholder="mycustomcode"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  maxLength={20}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleShorten}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Shortening...</span>
                </div>
              ) : (
                'Shorten URL'
              )}
            </button>
          </div>
        </div>

        {/* Shortened URL List */}
        {shortenedUrls.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Shortened URLs</h3>
            <div className="grid gap-4">
              {shortenedUrls.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Link2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-blue-600 truncate">{item.shortUrl}</p>
                          <p className="text-sm text-gray-600 truncate">{item.originalUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>{item.clicks} clicks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUrlClick(item.id)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Visit</span>
                      </button>

                      <button
                        onClick={() => window.open(item.qrCode, '_blank')}
                        className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR</span>
                      </button>

                      <button
                        onClick={() => handleCopy(item.shortUrl, item.id)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No shortened URLs yet. Create your first one above!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2025 LinkShort. Built with React & Tailwind CSS</p>
      </footer>
    </div>
  );
}

export default App;
