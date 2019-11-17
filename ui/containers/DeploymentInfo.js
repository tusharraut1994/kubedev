import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import useSWR from 'swr';

import * as kubectl from '../kubectl';
import {
  getDeployment,
  scaleDeployment,
  deleteDeployment
} from '../state-management/deployments-management';
import Table from '../components/Table';
import Input from '../components/Input';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { Link } from '@reach/router';
import Icon from '../components/Icon';
import StatusIcon from '../components/StatusIcon';

const CustomInput = styled(Input)`
  font-size: 14px;
`;

const SectionTitle = styled.h3`
  margin-top: 16px;
  margin-bottom: 8px;
`;

const PodStatusIcon = styled(StatusIcon)`
  width: 12px;
  height: 12px;
`;

const RefreshIcon = styled(Icon)`
  margin-right: 5px;
`;

export default function DeploymentInfo({ namespace, name, navigate }) {
  const [scale, setScale] = useState('');
  const {
    data: {
      data: { metadata, spec, status }
    },
    error,
    isValidating,
    revalidate
  } = useSWR(
    [namespace, `get deployment ${name}`],
    (namespace, command) => kubectl.exec(namespace, command, true),
    {
      suspense: true
    }
  );
  const {
    data: {
      data: { items: podItems }
    }
  } = useSWR(
    [namespace, `get pods -l=app=${metadata.labels.app}`],
    kubectl.exec,
    { suspense: true }
  );

  const handleScale = () => {
    kubectl
      .exec(namespace, `scale deploy ${name} --replicas=${scale}`, false)
      .then(() => revalidate());
  };

  const handleDelete = () => {
    kubectl
      .exec(namespace, `delete deploy ${name}`, false)
      .then(() => navigate(`/${namespace}/deployments`))
      .catch(err => console.error(err));
  };

  const handleEdit = () => {
    navigate(`/${namespace}/deployments/${name}/edit`);
  };

  const handleRefresh = () => revalidate();

  useMemo(() => setScale(spec.replicas), [spec.replicas]);

  return (
    <div>
      <PageHeader title={metadata.name}>
        <RefreshIcon onClick={handleRefresh}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path fill="none" d="M0 0h24v24H0V0z" />
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </RefreshIcon>
        <Button type="error" onClick={handleDelete}>
          DELETE
        </Button>
        <Button onClick={handleEdit}>EDIT</Button>
        <Button onClick={handleScale}>SAVE</Button>
      </PageHeader>
      <SectionTitle>Status</SectionTitle>
      <Table>
        <thead>
          <tr>
            <th>Replicas</th>
            <th>Ready Replicas</th>
            <th>Available Replicas</th>
            <th>Updated Replicas</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <CustomInput
                type="text"
                placeholder="Replicas"
                value={scale}
                onChange={event => setScale(+event.target.value)}
              />
            </td>
            <td>{status.readyReplicas}</td>
            <td>{status.availableReplicas}</td>
            <td>{status.updatedReplicas}</td>
          </tr>
        </tbody>
      </Table>
      <SectionTitle>Pods</SectionTitle>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>State</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          {podItems.map(({ metadata, status }) => (
            <tr key={metadata.name}>
              <td>{metadata.name}</td>
              <td>
                <PodStatusIcon state={status.phase} />
              </td>
              <td>
                <Link to={`/${namespace}/pods/${metadata.name}/info`}>
                  <Icon
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path fill="none" d="M0 0h24v24H0V0z" />
                    <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </Icon>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
