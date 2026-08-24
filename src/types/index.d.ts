/**
 * 接口返回数据格式
 * 与后端 xhttp.Response 保持一致
 */
interface ApiResponse<T> {
	code: number
	msg: string
	data: T
}

/**
 * 分页数据格式
 * 与后端 xhttp.PageResult 保持一致
 */
interface PageResult<T> {
	total: number
	page: number
	page_size: number
	items: T[]
}

/**
 * 分页接口返回数据格式
 */
interface ApiListResponse<T> extends ApiResponse<PageResult<T>> {}

/**
 * 拉取表格请求参数
 */
interface ApiTableRequest extends Record<string, any> {
	cqs?: string
	page_size?: number
	page?: number
}

type Recordable<T = any> = Record<string, T>;
