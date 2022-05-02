import {useLocalStorage} from '../../hooks/useLocalStorage';
import React from 'react';


const myBasePath = '/home/pieter/github/planet4-docker-compose/persistence/app/public/wp-content/';
const defaultReplacements = {
  'planet4-master-theme': myBasePath + 'themes/planet4-master-theme/',
  'planet4-plugin-gutenberg-blocks': myBasePath + 'plugins/planet4-plugin-gutenberg-blocks/',
};

export function IdeLink(props) {
  const {
    source,
    line,
    generated: {sheet},
  } = props;
  if (!source) {
    return null;
  }
  const path = source.replace('webpack://', '').replace(/home\/circleci\/[\w-]+\//, '').replace('/root/project/', '');
  // No setter for now, enter manually in local storage.
  const [customReplacements] = useLocalStorage('repo-paths', null, 'object');

  let basePath;
  const replacements = customReplacements || defaultReplacements;
  for (const needle in replacements) {
    if (sheet.includes(needle)) {
      basePath = replacements[needle];
      break;
    }
  }
  if (!basePath) {
    return null;
  }

  // This protocol requires installing a handler on your system.
  return <a
    href={`phpstorm://open?file=${basePath.replace(/\/+$/, '') + '/' + path.replace(/^\//, '')}&line=${line}`}
    style={{color: 'blue', fontSize: '12px'}}
    onClick={e => e.stopPropagation()}
  >{path} {line}</a>;
}
