/**
 * _registry.js — AUTO-MANAGED by backend on every module create/delete.
 * DO NOT remove the [MODULES_START] / [MODULES_END] markers.
 */

// [MODULES_START]
import Test1ListPage from './Test1ListPage';
import Test1FormPage from './Test1FormPage';
import Test5ListPage from './Test5ListPage';
import Test5FormPage from './Test5FormPage';
// [MODULES_END]

const registry = [
  { slug: 'test1', ListPage: Test1ListPage, FormPage: Test1FormPage },
  { slug: 'test5', ListPage: Test5ListPage, FormPage: Test5FormPage },
];
export default registry;
