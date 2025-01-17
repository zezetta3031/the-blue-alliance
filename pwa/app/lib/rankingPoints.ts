import { Match } from '~/api/v3';

export const RANKING_POINT_LABELS: Record<number, string[]> = {
  2016: ['Defenses Breached', 'Tower Captured'],
  2017: ['Pressure Reached', 'All Rotors Engaged'],
  2018: ['Auto Quest', 'Face The Boss'],
  2019: ['Complete Rocket', 'Hab Docking'],
  2020: ['Shield Energized', 'Shield Operational'],
  2022: ['Cargo Bonus', 'Hangar Bonus'],
  2023: ['Sustainability Bonus', 'Activation Bonus'],
  2024: ['Melody Bonus', 'Ensemble Bonus'],
};

type MatchScoreBreakdown = NonNullable<Match['score_breakdown']>['red'];
export function getBonusRankingPoints(
  scoreBreakdown: MatchScoreBreakdown,
): boolean[] {
  // 2016
  if ('teleopDefensesBreached' in scoreBreakdown) {
    return [
      scoreBreakdown.teleopDefensesBreached ?? false,
      scoreBreakdown.teleopTowerCaptured ?? false,
    ];
  }

  // 2017
  if ('kPaRankingPointAchieved' in scoreBreakdown) {
    return [
      scoreBreakdown.kPaRankingPointAchieved ?? false,
      scoreBreakdown.rotorRankingPointAchieved ?? false,
    ];
  }

  // 2018
  if ('autoQuestRankingPoint' in scoreBreakdown) {
    return [
      scoreBreakdown.autoQuestRankingPoint ?? false,
      scoreBreakdown.faceTheBossRankingPoint ?? false,
    ];
  }

  // 2019
  if ('completeRocketRankingPoint' in scoreBreakdown) {
    return [
      scoreBreakdown.completeRocketRankingPoint ?? false,
      scoreBreakdown.habDockingRankingPoint ?? false,
    ];
  }

  // 2020
  if ('shieldOperationalRankingPoint' in scoreBreakdown) {
    return [
      scoreBreakdown.shieldEnergizedRankingPoint ?? false,
      scoreBreakdown.shieldOperationalRankingPoint ?? false,
    ];
  }

  // 2022
  if ('cargoBonusRankingPoint' in scoreBreakdown) {
    return [
      scoreBreakdown.cargoBonusRankingPoint ?? false,
      scoreBreakdown.hangarBonusRankingPoint ?? false,
    ];
  }

  // 2023
  if ('sustainabilityBonusAchieved' in scoreBreakdown) {
    return [
      scoreBreakdown.sustainabilityBonusAchieved ?? false,
      scoreBreakdown.activationBonusAchieved ?? false,
    ];
  }

  // 2024
  if ('melodyBonusAchieved' in scoreBreakdown) {
    return [
      scoreBreakdown.melodyBonusAchieved ?? false,
      scoreBreakdown.ensembleBonusAchieved ?? false,
    ];
  }

  return [];
}
