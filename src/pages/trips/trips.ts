import { Component } from '@angular/core';
import { AlertController, Events, ModalController, NavController, PopoverController, ToastController } from 'ionic-angular';
import { Trip } from '../../app/trip';
import { Trips } from '../../app/trips';
import { Map } from '../../app/map';
import { Path } from '../../app/path';
import { Preferences, Settings } from '../../app/settings';
import { TripDetailPage } from '../trip-detail/trip-detail';
import { TripFormPage } from '../trip-form/trip-form';
import { TripsOptionsPage } from '../trips-options/trips-options';
import { notify } from '../../app/utils';

@Component({
  selector: 'page-trips',
  templateUrl: 'trips.html'
})
export class TripsPage {
  private trips: Trip[] = [];
  private hasTrips: boolean;
  private isActiveTab = false;
  private listView: boolean;

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private events: Events,
    private tripManager: Trips,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private settings: Settings,
    private toastCtrl: ToastController,
    private map: Map) {
      this.events.subscribe('state:active', this.onActiveChange.bind(this));
      this.events.subscribe('settings:preferences', this.updateView.bind(this));
      this.settings.getPreferences().then(this.updateView.bind(this));
    }

  ionViewWillEnter() {
    console.log('Trips Page: will enter view');
    this.isActiveTab = true;
    this.updateTrips();
  }

  ionViewWillLeave() {
    console.log('Trips Page: will leave view');
    this.isActiveTab = false;
    this.map.unassign();
  }

  private onActiveChange(active: boolean) {
    if (active && this.isActiveTab) this.updateTrips();
  }

  private updateTrips() {
    this.tripManager.all('start_time DESC').then((trips) => {
      if (trips.length) {
        this.hasTrips = true;
        this.trips = trips;
        this.loadTripImages();
      } else {
        this.hasTrips = false;
      }
    });
  }

  public goToMap() {
    this.navCtrl.parent.select(0);
  }

  private loadTripImages() {
    this.trips.forEach((trip) => {
      if (!trip.imageUrl) this.createTripImage(trip);
    });
  }

  private createTripImage(trip) {
    this.map.assign('trip-image-map', {
      interactive: false
    });
    this.tripManager.getLocations(trip)
      .then((locations) => this.map.createPathImage(new Path(locations)))
      .then((blob) => this.tripManager.saveImage(trip, blob));
  }

  public goToTripDetail(trip: Trip) {
    this.navCtrl.push(TripDetailPage, trip);
  }

  public showTripForm(trip) {
    let modal = this.modalCtrl.create(TripFormPage, trip);
    modal.present();
  }

  public confirmDelete(trip: Trip) {
    let confirm = this.alertCtrl.create({
      title: 'Delete this trip?',
      message: 'Deleting a trip cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteTrip(trip)
        }
      ]
    });
    confirm.present();
  }

  private deleteTrip(trip) {
    this.tripManager.delete(trip)
      .then(() => {
        this.trips.splice(this.trips.indexOf(trip), 1);
        notify(this.toastCtrl, 'Trip deleted.');
      });
  }

  public showOptions() {
    let optionsPopover = this.popoverCtrl.create(TripsOptionsPage);
    optionsPopover.present();
  }

  private updateView(prefs: Preferences) {
    this.listView = prefs.tripsListView;
  }
}
