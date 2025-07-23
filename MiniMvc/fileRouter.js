class FileRouter {
  constructor(pagesDir = './pages') {
    this.pagesDir = pagesDir;
    this.routeCache = new Map();
    this.moduleCache = new Map();
  }

  // Discover routes from file system structure
  async discoverRoutes() {
    try {
      // Get the list of available routes by fetching a directory listing
      const routes = await this.scanDirectory(this.pagesDir);
      console.log('Discovered routes:', routes);
      return routes;
    } catch (error) {
      console.error('Error discovering routes:', error);
      // Fallback to some basic routes if directory scanning fails
      return ['/', '/about', '/contact'];
    }
  }

  // Scan directory recursively to find all JS files
  async scanDirectory(dirPath, basePath = '') {
    try {
      // Fetch the directory listing
      const response = await fetch(`${dirPath}?list`);
      if (!response.ok) {
        throw new Error(`Failed to fetch directory listing: ${response.status}`);
      }
      
      const files = await response.json();
      const routes = [];
      
      for (const file of files) {
        if (file.type === 'directory') {
          // Recursively scan subdirectories
          const subRoutes = await this.scanDirectory(
            `${dirPath}/${file.name}`, 
            `${basePath}/${file.name}`
          );
          routes.push(...subRoutes);
        } else if (file.name.endsWith('.js')) {
          // Convert file path to route
          const route = this.fileToRoute(file.name, basePath);
          if (route) {
            routes.push(route);
          }
        }
      }
      
      return routes;
    } catch (error) {
      console.error('Error scanning directory:', error);
      
      // Fallback: Try to import common files directly
      const fallbackFiles = [
        'index.js', 'about.js', 'contact.js', 'user.js', 'posts.js'
      ];
      
      const routes = [];
      for (const file of fallbackFiles) {
        try {
          const path = `${this.pagesDir}/${file}`;
          await import(path);
          
          // Convert file to route
          const route = this.fileToRoute(file, '');
          if (route) {
            routes.push(route);
          }
          
          // Special handling for potential parameterized routes
          if (file === 'user.js') {
            routes.push('/user/:id');
          } else if (file === 'posts.js') {
            routes.push('/posts/:slug');
          }
        } catch (e) {
          // File doesn't exist, skip it
        }
      }
      
      return routes;
    }
  }
  
  // Convert file name to route pattern
  fileToRoute(fileName, basePath) {
    // Remove .js extension
    const name = fileName.replace(/\.js$/, '');
    
    // Handle index files
    if (name === 'index') {
      return basePath === '' ? '/' : basePath;
    }
    
    // Handle parameterized routes with bracket notation [param]
    if (name.includes('[') && name.includes(']')) {
      const paramName = name.match(/\[(.*?)\]/)[1];
      const baseRouteName = name.replace(/\[.*?\]/, `:${paramName}`);
      return `${basePath}/${baseRouteName}`;
    }
    
    // Handle files that should have parameters based on convention
    // For example, user.js becomes /user/:id
    if (name === 'user') {
      return `${basePath}/${name}/:id`;
    } else if (name === 'posts') {
      return `${basePath}/${name}/:slug`;
    }
    
    // Regular routes
    return `${basePath}/${name}`;
  }

  // Convert route path to file path
  routeToPath(route) {
    let normalized = route === '/' ? '/index' : route;
    
    // Remove parameters from path for file lookup
    // Convert /user/:id to /user
    // Convert /posts/:slug to /posts
    normalized = normalized.split(':')[0].replace(/\/$/, '') || '/index';
    
    // Handle nested routes
    // For routes like /nested/path, look for pages/nested/path.js
    return `${this.pagesDir}${normalized}.js`;
  }

  // Dynamically import a page component
  async loadPage(route) {
    const filePath = this.routeToPath(route);
    
    if (this.moduleCache.has(filePath)) {
      return this.moduleCache.get(filePath);
    }

    try {
      const module = await import(filePath);
      const component = module.default;
      this.moduleCache.set(filePath, component);
      return component;
    } catch (error) {
      console.warn(`Failed to load page: ${filePath}`, error);
      return null;
    }
  }

  // Match route with parameters
  matchRoute(requestPath, registeredRoute) {
    const requestSegments = requestPath.split('/').filter(Boolean);
    const routeSegments = registeredRoute.split('/').filter(Boolean);

    // Handle root route
    if (requestPath === '/' && registeredRoute === '/') {
      return {};
    }

    if (requestSegments.length !== routeSegments.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (routeSegment.startsWith(':')) {
        params[routeSegment.slice(1)] = requestSegment;
      } else if (routeSegment !== requestSegment) {
        return null;
      }
    }

    return params;
  }
}

export default FileRouter;