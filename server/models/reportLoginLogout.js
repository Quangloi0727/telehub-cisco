exports.reportLoginLogout = async (db, dbMssql, body) => {
  try {
    const { startTime, endTime, type, agents, agentTeams } = body;
    let _query = '';

    if (type == 'total') {
      _query = `
        USE tempdb exec report_login_logout_total_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'
      `;
    }

    if (type == 'by-day') {
      _query = `
        USE tempdb exec report_login_logout_per_day_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'
      `;
    }

    if (type == 'by-time') {
      _query = `
        USE tempdb exec dev_report_login_logout_per_time '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'
      `;
    }

    console.info(`------- _query ------- reportLoginLogout`);
    console.info(_query);
    console.info(`------- _query ------- reportLoginLogout`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};