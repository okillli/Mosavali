// Shim for next/navigation - uses hash-based routing for Vite

export const useRouter = () => ({
  push: (path: string) => {
    window.location.hash = path;
  },
  replace: (path: string) => {
    window.location.hash = path;
  },
  back: () => {
    window.history.back();
  },
  refresh: () => {
    window.location.reload();
  },
});

export const usePathname = () => {
  return window.location.hash.slice(1) || '/';
};

export const useParams = () => {
  const path = window.location.hash.slice(1).split('/');
  return path.length > 3 ? { id: path[3] } : {};
};
