import { AxiosError } from 'axios';
import { enqueueSnackbar } from 'notistack';

interface ApiError {
  detail: string;
  status_code: number;
  timestamp: string;
  path?: string;
  method?: string;
  error_id?: string;
}

export const handleApiError = (error: AxiosError<ApiError>) => {
  const defaultMessage = 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.';
  
  if (error.response) {
    const { data, status } = error.response;
    
    // Handle specific status codes
    switch (status) {
      case 400:
        enqueueSnackbar(data.detail || 'درخواست نامعتبر است.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        break;
      
      case 401:
        enqueueSnackbar('لطفاً مجدداً وارد شوید.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        // Redirect to login if needed
        window.location.href = '/login';
        break;
      
      case 403:
        enqueueSnackbar('شما دسترسی به این بخش را ندارید.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        break;
      
      case 404:
        enqueueSnackbar('منبع مورد نظر یافت نشد.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        break;
      
      case 429:
        enqueueSnackbar('تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        break;
      
      case 500:
        enqueueSnackbar(data.detail || 'خطای داخلی سرور رخ داده است.', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
        break;
      
      default:
        enqueueSnackbar(data.detail || defaultMessage, { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status,
        data,
        path: error.config?.url,
        method: error.config?.method
      });
    }
  } else if (error.request) {
    // Network error
    enqueueSnackbar('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.', { 
      variant: 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'center' }
    });
  } else {
    enqueueSnackbar(defaultMessage, { 
      variant: 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'center' }
    });
  }
  
  // Re-throw error for component-level handling if needed
  throw error;
};

export const setupAxiosInterceptors = (axiosInstance: any) => {
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    (error: AxiosError<ApiError>) => {
      handleApiError(error);
      return Promise.reject(error);
    }
  );
}; 