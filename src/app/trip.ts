import { Location } from './location';
import { Persistent } from './persistent';
import { CURRENT_VERSION } from './utils';

export class Trip extends Persistent {

  static NEAR_THESHOLD = 500; // Maximum distance for location guesses, in meters
  static SIMPLIFY_TOLERANCE = 0.0002; // degrees
  static SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS trip (
      id INTEGER PRIMARY KEY ASC NOT NULL,
      origin_type INTEGER NOT NULL DEFAULT 0,
      destination_type INTEGER NOT NULL DEFAULT 0,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      distance DOUBLE NOT NULL,
      transit BOOLEAN DEFAULT 0,
      submitted BOOLEAN DEFAULT 0,
      desired_accuracy integer NOT NULL DEFAULT 0,
      app_version character varying(10) NOT NULL
    )
  `;
  static SQL_TABLE = 'trip';
  static SQL_COLUMNS = [
    'origin_type',
    'destination_type',
    'start_time',
    'end_time',
    'distance',
    'transit',
    'submitted',
    'desired_accuracy',
    'app_version'
  ];

  static fromRow(row) {
    return new Trip(
      row.id,
      row.origin_type,
      row.destination_type,
      row.start_time,
      row.end_time,
      row.distance,
      row.transit,
      row.submitted,
      row.desired_accuracy,
      row.app_version
    )
  }

  static getMigrations(toVersion) {
    if (toVersion == 1) return [Trip.SQL_CREATE_TABLE];
    return [];
  }

  static get(where?: string, order?: string) {
    return Persistent.get(
      Trip.SQL_TABLE,
      Trip.SQL_COLUMNS,
      where, order).then((rows) => rows.map(Trip.fromRow));
  }

  constructor(
    public id: number = null,
    public origin: number = 0,
    public destination: number = 0,
    public startTime: Date = null,
    public endTime: Date = null,
    public distance = 0,
    public transit: boolean = false,
    public submitted: boolean = false,
    public desiredAccuracy: number = 0,
    public appVersion: string = CURRENT_VERSION) {
      super();
    }

  protected toRow() {
    return [
      this.origin,
      this.destination,
      this.startTime.getTime(),
      this.endTime.getTime(),
      this.distance,
      this.transit,
      this.submitted,
      this.desiredAccuracy,
      this.appVersion
    ];
  }

  public getLocations() {
    return Location.get('trip_id = ' + this.id,  'time ASC');
  }

}
