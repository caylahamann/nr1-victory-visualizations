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

export default class BillboardLineChart extends React.Component {
  static propTypes = {
    nrqlQuery: PropTypes.shape({
      accountId: PropTypes.number,
      query: PropTypes.string,
    }),
  };

  render() {
    const { nrqlQuery } = this.props;

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

              return (
                <div width={width} height={height}>
                  <HeadingText>{nrqlQuery.accountId}</HeadingText>
                  <HeadingText>{nrqlQuery.query}</HeadingText>
                </div>
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
