export function usePdfReport() {
  async function openReportForPrint(params: {
    sheetId: string
    reactorId?: string
    surveyId: string
  }) {
    const { sheetId, reactorId, surveyId } = params

    let reportPath = `/report/${sheetId}`
    if (reactorId) {
      reportPath += `/${reactorId}`
    }
    reportPath += `?surveyId=${surveyId}`

    // Open in new window for printing
    window.open(reportPath, '_blank')
  }

  return {
    openReportForPrint
  }
}
