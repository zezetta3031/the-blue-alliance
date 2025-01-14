import {
  MatchScoreBreakdown2015Alliance,
  MatchScoreBreakdown2016Alliance,
  MatchScoreBreakdown2017Alliance,
  MatchScoreBreakdown2018Alliance,
  MatchScoreBreakdown2019Alliance,
  MatchScoreBreakdown2020Alliance,
  MatchScoreBreakdown2022Alliance,
  MatchScoreBreakdown2023Alliance,
  MatchScoreBreakdown2024Alliance,
} from '~/api/v3';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

function RpDot({
  rpIndex,
  tooltipText,
}: {
  rpIndex: number;
  tooltipText: string;
}): React.JSX.Element {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <svg
            className={cn('h-[4px] absolute top-[2px] left-[3px] w-[4px]', {
              'ml-0': rpIndex === 0,
              'ml-[6px]': rpIndex === 1,
            })}
          >
            <circle cx={2} cy={2} r={2} />
          </svg>
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-normal">{tooltipText}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RpDotsInner({
  rps_achieved,
  tooltipTexts,
}: {
  rps_achieved: boolean[];
  tooltipTexts: string[];
}) {
  return (
    <>
      {rps_achieved.map((rp, index) =>
        rp ? (
          <RpDot
            key={index}
            rpIndex={index}
            tooltipText={tooltipTexts[index]}
          />
        ) : null,
      )}
    </>
  );
}

export default function RpDots({
  score_breakdown,
}: {
  score_breakdown:
    | MatchScoreBreakdown2015Alliance
    | MatchScoreBreakdown2016Alliance
    | MatchScoreBreakdown2017Alliance
    | MatchScoreBreakdown2018Alliance
    | MatchScoreBreakdown2019Alliance
    | MatchScoreBreakdown2020Alliance
    | MatchScoreBreakdown2022Alliance
    | MatchScoreBreakdown2023Alliance
    | MatchScoreBreakdown2024Alliance
    | null
    | undefined;
}) {
  if (score_breakdown === null || score_breakdown === undefined) {
    return <></>;
  }

  // 2016
  if ('teleopDefensesBreached' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.teleopDefensesBreached ?? false,
          score_breakdown.teleopTowerCaptured ?? false,
        ]}
        tooltipTexts={['Defenses Breached', 'Tower Captured']}
      />
    );
  }

  // 2017
  if ('kPaRankingPointAchieved' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.kPaRankingPointAchieved ?? false,
          score_breakdown.rotorRankingPointAchieved ?? false,
        ]}
        tooltipTexts={['Pressure Reached', 'All Rotors Engaged']}
      />
    );
  }

  // 2018
  if ('autoQuestRankingPoint' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.autoQuestRankingPoint ?? false,
          score_breakdown.faceTheBossRankingPoint ?? false,
        ]}
        tooltipTexts={['Auto Quest', 'Face The Boss']}
      />
    );
  }

  // 2019
  if ('completeRocketRankingPoint' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.completeRocketRankingPoint ?? false,
          score_breakdown.habDockingRankingPoint ?? false,
        ]}
        tooltipTexts={['Complete Rocket', 'Hab Docking']}
      />
    );
  }

  // 2020
  if ('shieldOperationalRankingPoint' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.shieldEnergizedRankingPoint ?? false,
          score_breakdown.shieldOperationalRankingPoint ?? false,
        ]}
        tooltipTexts={['Shield Energized', 'Shield Operational']}
      />
    );
  }

  // 2022
  if ('cargoBonusRankingPoint' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.cargoBonusRankingPoint ?? false,
          score_breakdown.hangarBonusRankingPoint ?? false,
        ]}
        tooltipTexts={['Cargo Bonus', 'Hangar Bonus']}
      />
    );
  }

  // 2023
  if ('sustainabilityBonusAchieved' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.sustainabilityBonusAchieved ?? false,
          score_breakdown.activationBonusAchieved ?? false,
        ]}
        tooltipTexts={['Sustainability Bonus', 'Activation Bonus']}
      />
    );
  }

  // 2024
  if ('melodyBonusAchieved' in score_breakdown) {
    return (
      <RpDotsInner
        rps_achieved={[
          score_breakdown.melodyBonusAchieved ?? false,
          score_breakdown.ensembleBonusAchieved ?? false,
        ]}
        tooltipTexts={['Melody Bonus', 'Ensemble Bonus']}
      />
    );
  }

  return <></>;
}
