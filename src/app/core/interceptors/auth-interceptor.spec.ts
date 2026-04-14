import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = localStorage.getItem('repuve_access_token');
  let type = localStorage.getItem('repuve_token_type');

  if (!token || !type) {
    token = sessionStorage.getItem('activation_token');
    type = 'Bearer';
  }

  if (token && type) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `${type} ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};