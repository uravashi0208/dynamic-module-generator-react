/**
 * _registry.js — AUTO-MANAGED by backend on every module create/delete.
 * DO NOT remove the [MODULES_START] / [MODULES_END] markers.
 */

// [MODULES_START]
import BasicFormListPage from './BasicFormListPage';
import BasicFormFormPage from './BasicFormFormPage';
import ChoiceFormListPage from './ChoiceFormListPage';
import ChoiceFormFormPage from './ChoiceFormFormPage';
import CxvxcvListPage from './CxvxcvListPage';
import CxvxcvFormPage from './CxvxcvFormPage';
import DateTimeFormListPage from './DateTimeFormListPage';
import DateTimeFormFormPage from './DateTimeFormFormPage';
import TesssassaListPage from './TesssassaListPage';
import TesssassaFormPage from './TesssassaFormPage';
import Test5ListPage from './Test5ListPage';
import Test5FormPage from './Test5FormPage';
// [MODULES_END]

const registry = [
  { slug: 'basic-form', ListPage: BasicFormListPage, FormPage: BasicFormFormPage },
  { slug: 'choice-form', ListPage: ChoiceFormListPage, FormPage: ChoiceFormFormPage },
  { slug: 'cxvxcv', ListPage: CxvxcvListPage, FormPage: CxvxcvFormPage },
  { slug: 'date-time-form', ListPage: DateTimeFormListPage, FormPage: DateTimeFormFormPage },
  { slug: 'tesssassa', ListPage: TesssassaListPage, FormPage: TesssassaFormPage },
  { slug: 'test5', ListPage: Test5ListPage, FormPage: Test5FormPage },
];
export default registry;
