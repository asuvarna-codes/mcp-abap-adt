import { McpError, ErrorCode, AxiosResponse } from '../lib/utils';
import { makeAdtRequest, return_error, return_response, getBaseUrl } from '../lib/utils';

export async function handleGetTypeInfo(args: any) {
    try {
        if (!args?.type_name) {
            throw new McpError(ErrorCode.InvalidParams, 'Type name is required');
        }
    } catch (error) {
        return return_error(error);
    }

    try {
        // URL-encode the type_name for the domain URL
        const encodedTypeNameForDomain = encodeURIComponent(args.type_name);
        const url = `${await getBaseUrl()}/sap/bc/adt/ddic/domains/${encodedTypeNameForDomain}/source/main`;
        const response = await makeAdtRequest(url, 'GET', 30000);
        return return_response(response);
    } catch (error) {
        // no domain found, try data element
        try {
            // URL-encode the type_name for the data element URL
            const encodedTypeNameForDataElement = encodeURIComponent(args.type_name);
            const url = `${await getBaseUrl()}/sap/bc/adt/ddic/dataelements/${encodedTypeNameForDataElement}`;
            const response = await makeAdtRequest(url, 'GET', 30000);
            return return_response(response);
        } catch (error) {
            return return_error(error);
        }
    }
}