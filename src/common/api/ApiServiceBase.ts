import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { AnyObject } from 'immer/dist/types/types-internal';

import { ApiResponse, IData } from '@common/api/ApiResponse';
import { ApiErrorDto } from '@common/api/ApiErrorDto';
import {
  ApiErrorNext,
  apiErrorNext,
} from '@common/api/services/ErrorNext/ApiErrorNext';
import { APP_PUBLIC_URL } from '@common/utils/constants';

export abstract class ApiServiceBase {
  private readonly axios: AxiosInstance;

  private readonly apiErrorNext: ApiErrorNext;

  private readonly baseUrl = APP_PUBLIC_URL;

  protected constructor() {
    this.axios = Axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.apiErrorNext = apiErrorNext;

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.apiErrorNext.sendError(error);

        throw error;
      },
    );
  }

  protected get<Response extends AnyObject>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Response>> {
    return this.response<Response>(this.axios.get(url, config));
  }

  protected post<
    Request extends AnyObject,
    Response extends AnyObject = AnyObject
  >(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Response>> {
    return this.response<Response>(this.axios.post(url, data, config));
  }

  protected put<
    Request extends AnyObject,
    Response extends AnyObject = AnyObject
  >(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Response>> {
    return this.response<Response>(this.axios.put(url, data, config));
  }

  protected patch<
    Request extends AnyObject,
    Response extends AnyObject = AnyObject
  >(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Response>> {
    return this.response<Response>(this.axios.patch(url, data, config));
  }

  protected delete<Response extends AnyObject = AnyObject>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Response>> {
    return this.response<Response>(this.axios.delete(url, config));
  }

  private response<Response extends AnyObject>(
    promise: AxiosPromise<IData<Response>>,
  ): Promise<ApiResponse<Response>> {
    return this.createResponseFromAxios<Response>(promise);
  }

  private isApiResponseType<Response extends AnyObject>(
    response: AnyObject,
  ): response is IData<Response> {
    return (
      response &&
      Number.isInteger(response.code) &&
      typeof response.message === 'string' &&
      typeof response.payload === 'object' &&
      (response.location === undefined || typeof response.location === 'string')
    );
  }

  private transformResponse<Response extends AnyObject>(
    response: AxiosResponse,
  ): ApiResponse<Response> | never {
    const { data } = response;

    if (this.isApiResponseType<Response>(data)) {
      return new ApiResponse<Response>(data);
    }

    throw new TypeError(
      `Server returned invalid data: ${JSON.stringify(response)}`,
    );
  }

  private async createResponseFromAxios<Response extends AnyObject>(
    promise: AxiosPromise<IData<Response>>,
  ): Promise<ApiResponse<Response>> {
    try {
      const response = await promise;

      return this.transformResponse(response);
    } catch (error) {
      if ('isAxiosError' in error && 'response' in error) {
        const { response: data } = error as AxiosError<IData<Response>>;

        if (!data) {
          throw new TypeError(
            `Server returned invalid data: ${JSON.stringify(data)}`,
          );
        }

        throw new ApiErrorDto(this.transformResponse(data));
      }

      throw error;
    }
  }
}
