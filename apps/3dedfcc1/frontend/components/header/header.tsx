import React from 'react';
import styles from './header.module.scss';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeaderProps {
    level: HeadingLevel;
    children: React.ReactNode;
    className?: string;
}

const Header = ({ level, children, className }: HeaderProps) => {
    const Tag = `h${level}` as `h${HeadingLevel}`;
    const moduleClass = styles[`h${level}`];

    return (
        <Tag className={[moduleClass, className].filter(Boolean).join(' ')}>
            {children}
        </Tag>
    );
};

export default Header;
