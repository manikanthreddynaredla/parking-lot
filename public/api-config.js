let apiBaseUrlPromise = null;

function cleanBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '');
}

function getApiBaseUrl() {
  if (!apiBaseUrlPromise) {
    apiBaseUrlPromise = fetch('/api/config')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Unable to load API configuration');
        }

        const config = await res.json();
        return cleanBaseUrl(config.apiBaseUrl || `${window.location.origin}/api/auth`);
      })
      .catch(() => cleanBaseUrl(`${window.location.origin}/api/auth`));
  }

  return apiBaseUrlPromise;
}

async function buildApiUrl(path) {
  const apiBaseUrl = await getApiBaseUrl();
  const cleanPath = String(path || '').replace(/^\/+/, '');

  return `${apiBaseUrl}/${cleanPath}`;
}
