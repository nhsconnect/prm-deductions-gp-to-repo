import { sendUpdateRequest } from '../../services/gp2gp';
import { logEvent } from '../../middleware/logging';
import { updateDeductionRequestStatus } from '../../services/database/deduction-request-repository';
import { Status } from '../../models/deduction-request';

export const handleUpdateRequest = async (pdsRetrievalResponse, nhsNumber, conversationId) => {
  if (pdsRetrievalResponse.status === 200) {
    logEvent('200 GP2GP response received', {
      response: pdsRetrievalResponse
    });

    const updateResponse = await sendUpdateRequest(
      pdsRetrievalResponse.data.data.serialChangeNumber,
      pdsRetrievalResponse.data.data.patientPdsId,
      nhsNumber,
      conversationId
    );

    if (updateResponse.status === 204) {
      const status = Status.PDS_UPDATE_SENT;
      await updateDeductionRequestStatus(conversationId, status);
      return updateResponse;
    } else throw new Error(`Failed to Update: ${updateResponse.data}`);
  } else {
    throw new Error(`Unexpected Error: ${pdsRetrievalResponse.data}`);
  }
};
