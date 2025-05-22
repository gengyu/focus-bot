import { App } from 'vue';

// 导入所有组件
import Alert from './Alert.vue';
import Avatar from './Avatar.vue';
import Badge from './Badge.vue';
import Button from './Button.vue';
import Card from './Card.vue';
import Checkbox from './Checkbox.vue';
import Input from './Input.vue';
import Modal from './Modal.vue';
import Select from './Select.vue';
import Spinner from './Spinner.vue';
import Switch from './Switch.vue';
import Tabs from './Tabs.vue';
import TabPanel from './TabPanel.vue';
import Tooltip from './Tooltip.vue';

// 组件列表
const components = {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Select,
  Spinner,
  Switch,
  Tabs,
  TabPanel,
  Tooltip
};

// 安装函数
const install = (app: App) => {
  Object.entries(components).forEach(([name, component]) => {
    app.component(`Focus${name}`, component);
  });
};

// 默认导出插件
export default { install };

// 导出单个组件
export {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Select,
  Spinner,
  Switch,
  Tabs,
  TabPanel,
  Tooltip
};