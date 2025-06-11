import { McpError, ErrorCode, AxiosResponse } from '../lib/utils';
import { makeAdtRequest, return_error, return_response, getBaseUrl } from '../lib/utils';

export async function handleGetCDSView(args: any) {
    try {
        if (!args?.cds_view_name) {
            throw new McpError(ErrorCode.InvalidParams, 'CDS View name is required');
        }

        // URL-encode the table_name
        const encodedCDSViewName = encodeURIComponent(args.cds_view_name);

        const url = `${await getBaseUrl()}/sap/bc/adt/ddic/ddl/sources/${encodedCDSViewName}/source/main`;
        const response = await makeAdtRequest(url, 'GET', 30000);
        return return_response(response);
    } catch (error) {
        return return_error(error);
    }
}