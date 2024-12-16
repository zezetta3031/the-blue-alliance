/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { LoaderFunctionArgs } from '@remix-run/node';
import {
  ClientLoaderFunctionArgs,
  MetaFunction,
  Params,
  useLoaderData,
} from '@remix-run/react';
import { countBy, groupBy, sumBy } from 'lodash-es';
import { useMemo } from 'react';

import {
  DistrictRanking,
  LeaderboardInsight,
  Match,
  getDistrictAwards,
  getDistrictEvents,
  getDistrictHistory,
  getDistrictRankings,
  getDistrictTeams,
  getEventMatches,
} from '~/api/v3';
import { TitledCard } from '~/components/tba/cards';
import { DataTable } from '~/components/tba/dataTable';
import { Leaderboard } from '~/components/tba/leaderboard';
import { EventLink, TeamLink } from '~/components/tba/links';
import { Badge } from '~/components/ui/badge';
import { Divider } from '~/components/ui/divider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { AwardType } from '~/lib/api/AwardType';
import { EventType } from '~/lib/api/EventType';
import {
  USA_STATE_ABBREVIATION_TO_FULL,
  joinComponents,
  parseParamsForYearElseDefault,
} from '~/lib/utils';

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

  // The api returns a lot of teams that previously played in the district but didn't in the given year
  const actuallyActiveRankings =
    rankings.data === null
      ? null
      : rankings.data.filter(
          (r) => r.point_total > 0 && (r.event_points?.length ?? 0) > 0,
        );

  const actuallyActiveTeams =
    actuallyActiveRankings === null
      ? teams.data
      : teams.data.filter((team) =>
          actuallyActiveRankings.find((r) => r.team_key === team.key),
        );

  const matchesByEvent = await Promise.all(
    events.data.map((e) => getEventMatches({ eventKey: e.key })),
  );

  if (matchesByEvent.some((m) => m.status !== 200)) {
    throw new Response(null, { status: 404 });
  }

  return {
    abbreviation: params.abbreviation,
    year,
    districtHistory: districtHistory.data,
    rankings: actuallyActiveRankings,
    teams: actuallyActiveTeams,
    events: events.data,
    awards: awards.data,
    matchesByEvent: matchesByEvent
      .filter((m) => m.status === 200)
      .map((m) => m.data),
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
    awards,
    districtHistory,
    events,
    rankings,
    teams,
    year,
    matchesByEvent,
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

  const teamsByLocation = groupBy(teams, (team) =>
    team.country === 'USA' ? team.state_prov : team.country,
  );
  const eventsByLocation = groupBy(
    events.filter((e) => e.event_type !== EventType.DISTRICT_CMP_DIVISION),
    (event) =>
      event.country === 'USA'
        ? USA_STATE_ABBREVIATION_TO_FULL.get(event.state_prov ?? '')
        : event.country,
  );

  const leaderboards = useMemo(
    () => calcLeaderboards({ matches: matchesByEvent.flat(), year }),
    [matchesByEvent, year],
  );

  return (
    <div>
      <h1 className="mt-4 text-4xl font-medium">
        {districtHistory[districtHistory.length - 1].display_name} {year}
      </h1>

      <Tabs defaultValue={'overview'} className="mt-4">
        <TabsList className="flex h-auto flex-wrap items-center justify-evenly [&>*]:basis-1/2 lg:[&>*]:basis-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasRankings && <TabsTrigger value="rankings">Rankings</TabsTrigger>}
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="gap-3 lg:grid lg:grid-cols-2">
            <TitledCard cardTitle={teams.length} cardSubtitle={'Teams'} />
            <TitledCard
              cardTitle={
                events.filter(
                  (e) => e.event_type !== EventType.DISTRICT_CMP_DIVISION,
                ).length
              }
              cardSubtitle={'Events'}
            />
          </div>

          {Object.keys(teamsByLocation).length > 1 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="">State</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(teamsByLocation)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([location, locationTeams]) => {
                    const locationEvents = eventsByLocation[location] ?? [];

                    return (
                      <TableRow key={location}>
                        <TableCell>{location}</TableCell>
                        <TableCell className="pl-4">
                          {locationTeams.length}
                        </TableCell>
                        <TableCell className="pl-4">
                          {locationEvents.length}
                          {locationEvents.find(
                            (e) => e.event_type === EventType.DISTRICT_CMP,
                          ) ? (
                            <Badge className="ml-2">DCMP</Badge>
                          ) : (
                            ''
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}

          {leaderboards.map((leaderboard) => (
            <Leaderboard
              leaderboard={leaderboard}
              key={leaderboard.name}
              year={year}
            />
          ))}

          {parentDCMPEvent && (
            <>
              <Divider className="py-4">
                <div className="text-xl">
                  <EventLink eventOrKey={parentDCMPEvent.key}>DCMP</EventLink>
                </div>
              </Divider>

              <div className="gap-3 lg:grid lg:grid-cols-2">
                <TitledCard
                  cardTitle={joinComponents(
                    dcmpAwards
                      .filter(
                        (award) => award.award_type === AwardType.CHAIRMANS,
                      )
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
                        .find(
                          (award) => award.award_type === AwardType.CHAIRMANS,
                        )
                        ?.name.replace('Regional', 'District Championship')}
                    </>
                  }
                />
                <TitledCard
                  cardTitle={joinComponents(
                    parentDCMPAwards
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
                        .find((award) => award.award_type === AwardType.WINNER)
                        ?.name.replace('Regional', 'District Championship')}
                    </>
                  }
                />
              </div>
            </>
          )}
        </TabsContent>

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

function calcLeaderboards({
  matches,
  year,
}: {
  matches: Match[];
  year: number;
}): LeaderboardInsight[] {
  return [calcMostMatchesPlayedLeaderboard(matches, year)];
}

function calcMostMatchesPlayedLeaderboard(
  matches: Match[],
  year: number,
): LeaderboardInsight {
  const flatTeamKeyOccurrences: string[] = matches.flatMap((match) => [
    ...match.alliances.red.team_keys,
    ...match.alliances.blue.team_keys,
  ]);

  return {
    name: 'Most Matches Played',
    year: year,
    data: {
      key_type: 'team',
      rankings: Object.entries(countBy(flatTeamKeyOccurrences))
        .map(([teamKey, count]) => ({
          keys: [teamKey],
          value: count,
        }))
        .sort((a, b) => b.value - a.value),
    },
  };
}
