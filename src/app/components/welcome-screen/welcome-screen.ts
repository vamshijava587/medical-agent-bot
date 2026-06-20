import { ChangeDetectionStrategy, Component, output } from '@angular/core';

interface SuggestionCard {
  icon: string;
  title: string;
  prompt: string;
}

@Component({
  selector: 'app-welcome-screen',
  imports: [],
  templateUrl: './welcome-screen.html',
  styleUrl: './welcome-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeScreen {
  readonly promptSelected = output<string>();

  readonly suggestions: SuggestionCard[] = [
    {
      icon: 'pulse',
      title: 'Understand a condition',
      prompt: 'What is diabetes and what are its early warning signs?',
    },
    {
      icon: 'pill',
      title: 'Medication basics',
      prompt: 'How do antibiotics work and when are they prescribed?',
    },
    {
      icon: 'thermometer',
      title: 'Symptom guidance',
      prompt: 'What could cause a persistent dry cough for two weeks?',
    },
    {
      icon: 'heart',
      title: 'Preventive care',
      prompt: 'What lifestyle changes help lower blood pressure naturally?',
    },
  ];
}
