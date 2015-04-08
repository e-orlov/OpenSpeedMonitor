package de.iteratec.osm.persistence

import de.iteratec.osm.ConfigService
import de.iteratec.osm.InMemoryConfigService
import org.joda.time.DateTime
import org.quartz.JobExecutionException


class DbCleanupOldMeasuredValuesWithDependenciesJob {

    DbCleanupService dbCleanupService
    ConfigService configService
    InMemoryConfigService inMemoryConfigService

    static triggers = {
        /**
         * Each Day at 3:00 am.
         */
        cron(name: 'DailyOldMeasuredValuesWithDependenciesCleanup', cronExpression: '0 01 15 ? * *')
    }

    def execute() {
        try{
            if(inMemoryConfigService.isDatabaseCleanupEnabled()) {
                Date toDeleteResultsBefore = new DateTime().minusMonths(configService.getMaxDataStorageTimeInMonths()).toDate()
                dbCleanupService.deleteMeasuredValuesAndMeasuredValueUpdateEventsBefore(toDeleteResultsBefore)
            }
        }catch (JobExecutionException e){
            log.error(e.toString())
        }
    }
}
