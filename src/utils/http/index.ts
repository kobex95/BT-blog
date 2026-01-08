/*
 * @Description: http 请求工具（支持多种后端）
 * @Author: 安知鱼
 */

import axios from "axios";
import { formatToken } from "./config";
import type { PureHttpError, RequestMethods, PureHttpResponse } from "./types";
import { useUserStoreHook } from "@/store/modules/user";
import { handleSupabaseError } from "@/utils/supabase";
import { supabaseHttp } from "./supabase";

// 获取环境变量中的后端类型
const BACKEND_TYPE = import.meta.env.VITE_BACKEND_TYPE || 'local'; // 'local' | 'supabase'

/**
 * HTTP 类（支持多种后端）
 */
class PureHttp {
  /**
   * 判断是否使用 Supabase 后端
   */
  private useSupabase(url: string): boolean {
    // 如果全局配置为 supabase，或者 API 路径以特定前缀开头
    if (BACKEND_TYPE === 'supabase') {
      return true;
    }

    // 可以根据 API 路径判断使用哪个后端
    const supabasePrefixes = [
      '/api/supabase',
      '/api/posts',
      '/api/categories',
      '/api/tags',
      '/api/comments'
    ];

    return supabasePrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * 通用请求方法
   */
  request<T = any, R = PureHttpResponse<T>>(
    method: RequestMethods,
    url: string,
    config?: any
  ): Promise<R> {
    // 如果使用 Supabase 后端
    if (this.useSupabase(url)) {
      return supabaseHttp.request(method, url, config);
    }

    // 否则使用传统后端（Axios）
    return this.axiosRequest(method, url, config);
  }

  /**
   * Axios 请求方法
   */
  private async axiosRequest<T = any, R = PureHttpResponse<T>>(
    method: RequestMethods,
    url: string,
    config?: any
  ): Promise<R> {
    const { data, params, ...restConfig } = config || {};

    return new Promise((resolve, reject) => {
      pureAxiosInstance
        .request({
          url,
          method,
          data,
          params,
          ...restConfig
        })
        .then((response: any) => {
          resolve(response as R);
        })
        .catch((error: PureHttpError) => {
          reject(error);
        });
    });
  }

  /**
   * GET 请求
   */
  get<T = any, R = PureHttpResponse<T>>(
    url: string,
    config?: any
  ): Promise<R> {
    return this.request("get", url, config);
  }

  /**
   * POST 请求
   */
  post<T = any, R = PureHttpResponse<T>>(
    url: string,
    data?: any,
    config?: any
  ): Promise<R> {
    return this.request("post", url, { data, ...config });
  }

  /**
   * PUT 请求
   */
  put<T = any, R = PureHttpResponse<T>>(
    url: string,
    data?: any,
    config?: any
  ): Promise<R> {
    return this.request("put", url, { data, ...config });
  }

  /**
   * DELETE 请求
   */
  delete<T = any, R = PureHttpResponse<T>>(
    url: string,
    config?: any
  ): Promise<R> {
    return this.request("delete", url, config);
  }

  /**
   * PATCH 请求
   */
  patch<T = any, R = PureHttpResponse<T>>(
    url: string,
    data?: any,
    config?: any
  ): Promise<R> {
    return this.request("patch", url, { data, ...config });
  }
}

// ========== Axios 实例配置 ==========

const pureAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
});

// 请求拦截器
pureAxiosInstance.interceptors.request.use(
  (config) => {
    const userStore = useUserStoreHook();

    // 添加认证 token
    if (userStore.getToken) {
      config.headers.Authorization = formatToken(userStore.getToken);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
pureAxiosInstance.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 统一响应格式
    if (data?.code === 200 || data?.success === true) {
      return data;
    } else {
      // 处理业务错误
      const errorMessage = data?.message || data?.msg || '操作失败';
      console.error('API Error:', errorMessage);

      // 401 未授权，跳转到登录页
      if (data?.code === 401 || data?.status === 401) {
        const userStore = useUserStoreHook();
        userStore.logOut();
        window.location.href = '/login';
      }

      return Promise.reject(new Error(errorMessage));
    }
  },
  (error) => {
    console.error('HTTP Error:', error);

    // 处理 HTTP 错误
    if (error.response) {
      const { status, data } = error.response;

      // 401 未授权
      if (status === 401) {
        const userStore = useUserStoreHook();
        userStore.logOut();
        window.location.href = '/login';
        return Promise.reject(new Error('未授权，请重新登录'));
      }

      // 403 禁止访问
      if (status === 403) {
        return Promise.reject(new Error('无权限访问'));
      }

      // 404 未找到
      if (status === 404) {
        return Promise.reject(new Error('请求的资源不存在'));
      }

      // 500 服务器错误
      if (status >= 500) {
        return Promise.reject(new Error('服务器错误，请稍后重试'));
      }

      // 其他错误
      return Promise.reject(
        new Error(data?.message || data?.msg || `请求失败 (${status})`)
      );
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    } else {
      // 请求配置错误
      return Promise.reject(new Error(error.message || '请求配置错误'));
    }
  }
);

// 导出单例
export const http = new PureHttp();
export default http;

// 同时导出 axios 实例以供特殊情况使用
export { pureAxiosInstance as axios };
