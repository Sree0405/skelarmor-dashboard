import "axios";

declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    skipOrgScope?: boolean;
  }

  export interface InternalAxiosRequestConfig<D = any> {
    skipOrgScope?: boolean;
  }
}
