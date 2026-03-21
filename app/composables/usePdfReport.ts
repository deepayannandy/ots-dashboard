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

  /**
   * Dashboard / deep links: full survey report when surveyId is known,
   * otherwise condensed report (tube sheet + reactor, print/save PDF in the new tab).
   */
  function openReportFromDashboard(params: {
    sheetId: string
    reactorId: string
    surveyId?: string | null
  }) {
    const { sheetId, reactorId, surveyId } = params
    let path = `/report/${sheetId}/${reactorId}`
    const q = new URLSearchParams()
    if (surveyId) {
      q.set('surveyId', surveyId)
    } else {
      q.set('condensed', 'true')
    }
    path += `?${q.toString()}`
    window.open(path, '_blank')
  }

  return {
    openReportForPrint,
    openReportFromDashboard
  }
}
