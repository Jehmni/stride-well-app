// Minimal Dashboard fallback module
// This will be served by the service worker when the main Dashboard module fails to load

export default function DashboardFallback() {
  // Create a simple fallback UI
  return {
    type: 'div',
    props: {
      className: 'min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center',
      children: [
        {
          type: 'div',
          props: {
            className: 'max-w-md text-center',
            children: [
              {
                type: 'h1',
                props: {
                  className: 'text-2xl font-bold mb-4',
                  children: 'Dashboard Unavailable'
                }
              },
              {
                type: 'p',
                props: {
                  className: 'mb-6 text-gray-600',
                  children: 'We\'re having trouble loading the dashboard. Please try refreshing the page or navigate to another section.'
                }
              },
              {
                type: 'div',
                props: {
                  className: 'flex gap-4 justify-center',
                  children: [
                    {
                      type: 'button',
                      props: {
                        className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
                        onClick: () => window.location.reload(),
                        children: 'Refresh Page'
                      }
                    },
                    {
                      type: 'button',
                      props: {
                        className: 'px-4 py-2 border border-gray-300 rounded hover:bg-gray-100',
                        onClick: () => window.location.href = '/',
                        children: 'Go to Home'
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  };
} 