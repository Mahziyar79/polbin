/**
 * @format
 */

import { AppRegistry, I18nManager } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// چیدمان راست‌به‌چپ برای رابط فارسی.
// نکته: بعد از اولین نصب، اپ باید یک‌بار کامل بسته و باز شود تا RTL اعمال گردد.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

AppRegistry.registerComponent(appName, () => App);
