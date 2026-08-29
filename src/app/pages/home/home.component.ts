import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  readonly year = new Date().getFullYear();

  readonly features = [
    {
      icon: '📸',
      title: 'Report in seconds',
      description: 'Snap a photo, drop a pin on the map, and submit a traffic violation in a few guided steps.'
    },
    {
      icon: '✅',
      title: 'Reviewed by admins',
      description: 'Every report is verified by our team before any action is taken, keeping the platform fair.'
    },
    {
      icon: '💰',
      title: 'Earn rewards',
      description: 'Approved reports credit your wallet. Track your earnings and payouts from your dashboard.'
    },
    {
      icon: '🛣️',
      title: 'Safer roads',
      description: 'Your reports help identify repeat offenders and make everyday commutes safer for everyone.'
    }
  ];

  readonly steps = [
    { number: 1, title: 'Spot a violation', text: 'Notice unsafe driving, illegal parking, or a signal jump.' },
    { number: 2, title: 'Report it', text: 'Add the vehicle details, location, and a clear photo.' },
    { number: 3, title: 'Get verified', text: 'An admin reviews the evidence and approves genuine reports.' },
    { number: 4, title: 'Get rewarded', text: 'Your wallet is credited once the report is approved.' }
  ];

  // Educational content — common traffic rules and typical penalties (India, Motor Vehicles Act).
  readonly rules = [
    {
      icon: '🪖',
      title: 'Always wear a helmet / seat belt',
      text: 'Two-wheeler riders and pillion must wear ISI helmets. Car occupants must buckle up — front and rear.',
      penalty: '₹1,000 fine (and possible 3-month licence suspension for no helmet).'
    },
    {
      icon: '📱',
      title: 'No mobile phone while driving',
      text: 'Using a handheld phone to call or text while driving is prohibited. Use it only for navigation, hands-free.',
      penalty: '₹1,000–₹5,000 fine; repeat offences cost more.'
    },
    {
      icon: '🚦',
      title: 'Obey signals and stop lines',
      text: 'Never cross on red. Stop behind the stop line and let pedestrians cross at zebra crossings.',
      penalty: '₹1,000–₹5,000 fine for jumping a red light.'
    },
    {
      icon: '⚡',
      title: 'Stick to the speed limit',
      text: 'Follow posted limits — they change near schools, junctions and residential zones.',
      penalty: '₹1,000–₹2,000 fine for over-speeding (LMV).'
    },
    {
      icon: '🍺',
      title: 'Never drink and drive',
      text: 'Driving with blood alcohol over the legal limit endangers everyone on the road.',
      penalty: '₹10,000 fine and/or up to 6 months jail for a first offence.'
    },
    {
      icon: '↔️',
      title: 'Lane discipline & indicators',
      text: 'Keep left, overtake only from the right, and always signal before turning or changing lanes.',
      penalty: '₹500–₹1,500 fine for improper lane use.'
    },
    {
      icon: '🅿️',
      title: 'Park only where allowed',
      text: 'Do not block footpaths, driveways, bus stops or junctions. Watch for no-parking signs.',
      penalty: '₹500–₹1,000 fine; vehicle may be towed.'
    },
    {
      icon: '🚑',
      title: 'Give way to emergency vehicles',
      text: 'Pull to the side for ambulances, fire engines and police vehicles with sirens on.',
      penalty: '₹10,000 fine for blocking an emergency vehicle.'
    }
  ];
}
