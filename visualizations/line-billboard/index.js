import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  AutoSizer,
} from 'nr1';
import NrqlQueryError from '../../src/nrql-query-error';
import NoDataState from '../../src/no-data-state';
import { VictoryLine, VictoryLabel } from 'victory';
import { baseLabelStyles } from '../../src/theme';
import { formatNumberTicks } from '../../src/utils/units';
import { linearRegression } from 'simple-statistics';

export default class BillboardLineChart extends React.Component {
  static propTypes = {
    nrqlQuery: PropTypes.shape({
      accountId: PropTypes.number,
      query: PropTypes.string,
    }),
    showColorForTrend: PropTypes.bool,
  };

  nrqlInputIsValid = (rawData) => {
    const { metadata } = rawData[0];

    return (
      metadata.groups.length === 1 &&
      metadata.groups[0]?.type === 'function' &&
      metadata.groups[0]?.value === 'count'
    );
  };

  transformData = (rawData) => {
    const { data } = rawData[0];
    let total = 0;

    const lineData = data.map(({ x, y }) => {
      total = total + y;
      return { x, y };
    });

    return { lineData, total };
  };

  getColor = (rawData) => {
    const { data } = rawData[0];

    const dataArray = data.map(({ x, y }) => [x, y]);

    const { m } = linearRegression(dataArray);

    if (m > 0) {
      return 'green';
    }

    if (m < 0) {
      return 'red';
    }

    return 'grey';
  };

  render() {
    const { nrqlQuery, showColorForTrend } = this.props;

    const nrqlQueryPropsAvailable =
      nrqlQuery && nrqlQuery.accountId && nrqlQuery.query;

    if (!nrqlQueryPropsAvailable) {
      return <EmptyState />;
    }

    return (
      <AutoSizer>
        {({ width, height }) => (
          <NrqlQuery
            query={nrqlQuery.query}
            accountId={parseInt(nrqlQuery.accountId)}
            pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
          >
            {({ data, loading, error }) => {
              if (loading) {
                return <Spinner />;
              }

              if (error && data === null) {
                return (
                  <NrqlQueryError
                    title="NRQL Syntax Error"
                    description={error.message}
                  />
                );
              }

              if (!data.length) {
                return <NoDataState />;
              }

              if (!this.nrqlInputIsValid(data)) {
                return (
                  <NrqlQueryError title="NRQL Syntax Error" description="" />
                );
              }

              console.log(data);

              const { lineData, total } = this.transformData(data);

              return (
                <svg
                  width={width}
                  height={height}
                  viewBox={`0 0 ${width} ${height}`}
                >
                  <VictoryLine
                    standalone={false}
                    width={width}
                    height={height}
                    data={lineData}
                    style={{
                      data: {
                        opacity: 0.15,
                        strokeWidth: 4,
                        stroke: showColorForTrend
                          ? this.getColor(data)
                          : 'blue',
                      },
                    }}
                  />
                  <VictoryLabel
                    text={[
                      formatNumberTicks({ unitType: 'COUNT', tick: total }),
                      data[0].metadata.name,
                    ]}
                    x={width / 2}
                    y={height / 2}
                    textAnchor="middle"
                    style={[
                      { ...baseLabelStyles, fontSize: 88, fill: '#2a3434' },
                      { ...baseLabelStyles, fontSize: 24 },
                    ]}
                  />
                </svg>
              );
            }}
          </NrqlQuery>
        )}
      </AutoSizer>
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide a NRQL query & account ID pair
      </HeadingText>
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
        type={HeadingText.TYPE.HEADING_4}
      >
        This Visualization supports NRQL queries with a{' '}
        <code>SELECT count([attribute])</code> over a timeseries. For example:
      </HeadingText>
      <code>FROM Transaction SELECT count(*) TIMESERIES</code>
    </CardBody>
  </Card>
);
