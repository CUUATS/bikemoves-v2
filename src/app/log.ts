import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { EmailComposer } from '@ionic-native/email-composer';
import { ObjectManager } from './object_manager';
import { Storage } from './storage';
import { LogEntry } from './log_entry';
import { DEBUG } from './config';
import * as moment from 'moment';

@Injectable()
export class Log extends ObjectManager {
  protected table = 'log_entry';
  protected columns = [
    'time',
    'category',
    'message'
  ];

  constructor(
    protected storage: Storage,
    protected events: Events,
    private emailComposer: EmailComposer) {
    super();
  }

  protected fromRow(row) {
    return new LogEntry(
      moment(row.time),
      row.category,
      row.message,
      row.id
    )
  }

  protected toRow(logEntry: LogEntry) {
    return [
      logEntry.time.valueOf(),
      logEntry.category,
      logEntry.message
    ];
  }

  public read() {
    return this.all('time ASC');
  }

  public write(category: string, message: string) {
    if (!DEBUG) return Promise.resolve();
    let entry = new LogEntry(moment(), category, message);
    return this.save(entry)
      .then(() => this.events.publish('log:write', entry));
  }

  public clear() {
    return this.batchDelete('time IS NOT NULL');
  }

  public send(address: string) {
    this.read().then((entries) => {
      let rows = entries.map((entry) => {
        let time = entry.time.format('YYYY-MM-DD kk:mm:ss.SSS');
        return `${time} [${entry.category}] ${entry.message}`;
      });

      return this.emailComposer.open({
        to: address,
        subject: 'BikeMoves Illinois logs: ' + moment().format('YYYY-MM-DD'),
        body: 'Logs: ' + moment().format('YYYY-MM-DD kk:mm:ss.SSS'),
        isHtml: false,
        attachments: [
          'base64:bikemoves-' + moment().format('YYYYMMDD') + '.log//' +
            window.btoa(rows.join('\n'))
        ]
      });
    });
  }
}

Storage.addMigration(8, `
  CREATE TABLE IF NOT EXISTS log_entry (
    id INTEGER PRIMARY KEY ASC NOT NULL,
    time INTEGER NOT NULL,
    category TEXT,
    message TEXT
  )
`);

Storage.addMigration(9,
  'CREATE INDEX log_entry_time ON log_entry(time);');