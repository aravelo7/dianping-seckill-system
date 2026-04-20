import { Card, Typography } from 'antd';
import type { ReactNode } from 'react';

interface PageCardProps {
  title: string;
  description?: string;
  extra?: ReactNode;
  children: ReactNode;
}

export default function PageCard({ title, description, extra, children }: PageCardProps) {
  return (
    <Card className="page-card" title={title} extra={extra}>
      {description && <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>}
      {children}
    </Card>
  );
}
