import { LoaderFunctionArgs } from '@remix-run/node';
import {
  ClientLoaderFunctionArgs,
  MetaFunction,
  Params,
  useLoaderData,
} from '@remix-run/react';
import { sumBy } from 'lodash-es';

import {
  DistrictRanking,
  getDistrictAwards,
  getDistrictEvents,
  getDistrictHistory,
  getDistrictRankings,
  getDistrictTeams,
} from '~/api/v3';
import { TitledCard } from '~/components/tba/cards';
import { DataTable } from '~/components/tba/dataTable';
import { TeamLink } from '~/components/tba/links';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { AwardType } from '~/lib/api/AwardType';
import { EventType } from '~/lib/api/EventType';
import { joinComponents, parseParamsForYearElseDefault } from '~/lib/utils';

async function loadData(params: Params) {
  if (params.abbreviation === undefined) {
    throw new Error('missing abbreviation');
  }

  const year = await parseParamsForYearElseDefault(params);
  if (year === undefined) {
    throw new Error('invalid year');
  }

  const [districtHistory, rankings, teams, events, awards] = await Promise.all([
    await getDistrictHistory({ districtAbbreviation: params.abbreviation }),
    await getDistrictRankings({ districtKey: `${year}${params.abbreviation}` }),
    await getDistrictTeams({ districtKey: `${year}${params.abbreviation}` }),
    await getDistrictEvents({ districtKey: `${year}${params.abbreviation}` }),
    await getDistrictAwards({ districtKey: `${year}${params.abbreviation}` }),
  ]);

  if (
    districtHistory.status !== 200 ||
    rankings.status !== 200 ||
    teams.status !== 200 ||
    events.status !== 200 ||
    awards.status !== 200
  ) {
    throw new Response(null, { status: 404 });
  }

  return {
    abbreviation: params.abbreviation,
    year,
    districtHistory: districtHistory.data,
    rankings:
      // The api returns a lot of teams that previously played in the district but didn't in the given year
      rankings.data === null
        ? null
        : rankings.data.filter(
            (r) => r.point_total > 0 && (r.event_points?.length ?? 0) > 0,
          ),
    teams: teams.data,
    events: events.data,
    awards: awards.data,
  };
}

export async function loader({ params }: LoaderFunctionArgs) {
  return await loadData(params);
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  return await loadData(params);
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `${data?.year} ${data?.districtHistory[data.districtHistory.length - 1].display_name} District - The Blue Alliance`,
    },
  ];
};

export default function DistrictPage() {
  const {
    abbreviation,
    awards,
    districtHistory,
    events,
    rankings,
    teams,
    year,
  } = useLoaderData<typeof loader>();

  const hasRankings = rankings !== null;

  const dcmpEvents = events.filter(
    (event) =>
      (event.event_type as EventType) === EventType.DISTRICT_CMP ||
      (event.event_type as EventType) === EventType.DISTRICT_CMP_DIVISION,
  );

  const parentDCMPEvent = dcmpEvents.find(
    (event) => (event.event_type as EventType) === EventType.DISTRICT_CMP,
  );

  const dcmpAwards = awards.filter(
    (award) =>
      dcmpEvents.find((event) => event.key === award.event_key) !== undefined,
  );

  const parentDCMPAwards = dcmpAwards.filter(
    (award) => award.event_key === parentDCMPEvent?.key,
  );

  return (
    <div>
      <h1 className="mt-4 text-4xl font-medium">
        {districtHistory[districtHistory.length - 1].display_name} {year}
      </h1>

      {dcmpAwards.length > 0 && (
        <div className="gap-3 lg:grid lg:grid-cols-2">
          <TitledCard
            cardTitle={joinComponents(
              dcmpAwards
                // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                .filter((award) => award.award_type === AwardType.CHAIRMANS)
                .flatMap((award) => award.recipient_list)
                .map((recipient) => recipient.team_key?.substring(3))
                .sort((a, b) => Number(a) - Number(b))
                .map((teamNumber) => (
                  <TeamLink
                    teamOrKey={`frc${teamNumber}`}
                    year={year}
                    key={teamNumber}
                  >
                    {teamNumber}
                  </TeamLink>
                )),
              <span className="font-medium">, </span>,
            )}
            cardSubtitle={
              <>
                {dcmpAwards
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                  .find((award) => award.award_type === AwardType.CHAIRMANS)
                  ?.name.replace('Regional', 'District Championship')}
              </>
            }
          />
          <TitledCard
            cardTitle={joinComponents(
              parentDCMPAwards
                // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                .filter((award) => award.award_type === AwardType.WINNER)
                .flatMap((award) => award.recipient_list)
                .map((recipient) => recipient.team_key?.substring(3))
                .sort((a, b) => Number(a) - Number(b))
                .map((teamNumber) => (
                  <TeamLink
                    teamOrKey={`frc${teamNumber}`}
                    year={year}
                    key={teamNumber}
                  >
                    {teamNumber}
                  </TeamLink>
                )),
              <span className="font-medium">, </span>,
            )}
            cardSubtitle={
              <>
                {dcmpAwards
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                  .find((award) => award.award_type === AwardType.WINNER)
                  ?.name.replace('Regional', 'District Championship')}
              </>
            }
          />
        </div>
      )}

      <Tabs defaultValue={hasRankings ? 'rankings' : 'events'} className="mt-4">
        <TabsList className="flex h-auto flex-wrap items-center justify-evenly [&>*]:basis-1/2 lg:[&>*]:basis-1">
          {hasRankings && <TabsTrigger value="rankings">Rankings</TabsTrigger>}
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>
        {hasRankings && (
          <TabsContent value="rankings">
            <DataTable
              data={rankings}
              columns={[
                { header: 'Rank', accessorFn: (ranking) => ranking.rank },
                {
                  header: 'Team',
                  cell: (cell) => (
                    <TeamLink teamOrKey={`frc${cell.getValue()}`} year={year}>
                      {cell.getValue()}
                    </TeamLink>
                  ),
                  accessorFn: (ranking) =>
                    Number(ranking.team_key.substring(3)),
                },
                {
                  header: 'Event 1',
                  cell: (info) => <div>{info.getValue() || '-'}</div>,
                  accessorFn: (ranking) =>
                    getNthNonDcmpEvent(ranking.event_points ?? [], 0)?.total ??
                    0,
                },
                {
                  header: 'Event 2',
                  cell: (info) => <div>{info.getValue() || '-'}</div>,
                  accessorFn: (ranking) =>
                    getNthNonDcmpEvent(ranking.event_points ?? [], 1)?.total ??
                    0,
                },
                {
                  header: 'DCMP',
                  cell: (info) => <div>{info.getValue() || '-'}</div>,
                  accessorFn: (ranking) =>
                    sumBy(
                      ranking.event_points?.filter(
                        (event) => event.district_cmp,
                      ),
                      (r) => r.total,
                    ),
                },
                {
                  header: 'Age Bonus',
                  cell: (info) => <div>{info.getValue() || '-'}</div>,
                  accessorFn: (ranking) => ranking.rookie_bonus ?? 0,
                },
                {
                  header: 'Total',
                  accessorFn: (ranking) => ranking.point_total,
                  cell: (info) => <div>{info.getValue()}</div>,
                },
              ]}
            />
          </TabsContent>
        )}
        <TabsContent value="events">Change your password here.</TabsContent>
        <TabsContent value="teams">Change your email here.</TabsContent>
      </Tabs>
    </div>
  );
}

function getNthNonDcmpEvent(
  rankings: NonNullable<DistrictRanking['event_points']>,
  n: number,
): NonNullable<DistrictRanking['event_points']>[number] | undefined {
  const events = rankings.filter((event) => !event.district_cmp);

  return events.length <= n ? undefined : events[n];
}
