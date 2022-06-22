export const DEV_SERVER_URI = 'http://localhost:9000';
export const DEV_WS_SERVER_URI = 'ws://localhost:9000';

export const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

export const GOOGLE_CLIENT_ID = '320721321078-iu61jffh7000m848qjha76o0qdrl6h7o.apps.googleusercontent.com';

export const REFRESH_ACCESS_TOKEN_TIME = 5 * 60 * 1000;

export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiamFtbnRjZyIsImEiOiJja3ZqMGk0bmRiZms0MnB0OXNpb2NneGo0In0.nDqGANM1cIwpqVLBl506Vw';

export const DEFAULT_COLOR = '#9575cd';

export const ALGOLIA_APP_ID = 'HOAE3WPXYN';
export const ALGOLIA_APP_KEY = '19ba9cfd0f40e1d1abf77d51c472c4e3';
export const ALGOLIA_INDEX_NAME = process.env.NODE_ENV === 'production'
  ? 'prod_mindscape'
  : 'dev_mindscape';

export const MOBILE_WIDTH = 420;

export const LOAD_LIMIT = 20;


export const IFRAMELY_API_KEY ='7ddcf037df1408738a31dbe056575ba1'
export const IFRAMELY_API_KEY_DARK='94bfef11d502890ea3be39545c43c2f9';
export const IFRAMELY_API_KEY_LIGHT='ccc8c698f47cd34726d1dde82d931c1f';

export const MAX_Z_INDEX = 2000000000;

export const TWIG_WIDTH = 360;

export const MENU_WIDTH = 400;
export const MENU_MIN_WIDTH = 300;

export const FRAME_WIDTH = 500;
export const FRAME_MIN_WIDTH = 300;

export const START_POST_I = 1;

export const SPACE_BAR_HEIGHT = 50;

export const VIEW_RADIUS = 100000;

export const NOT_FOUND = 'NOT_FOUND'


export const persistConfigKey = 'redux';

export const PORT_NAME = 'mindscpap.pub';


export enum TabColor {
  none = 'none',
  grey = 'dimgrey',
  blue = 'blue',
  red = 'red',
  yellow = 'yellow',
  green = 'green',
  pink = 'pink',
  purple = 'purple',
  cyan = 'cyan',
  orange = 'orange',
}

export enum DisplayMode {
  SCATTERED = 'SCATTERED',
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
};

export enum AlarmType {
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  NO_GROUP = 'NO_GROUP',
  MOVE_REQUIRED = 'MOVE_REQUIRED',
  GROUP_REQUIRED = 'GROUP_REQUIRED',
  SELECT_TAB = 'SELECT_TAB',
  UPDATE_TAB = 'UPDATE_TAB',
};

export enum MessageName {
  RESTORE_CACHE = 'RESTORE_CACHE',
  PURGE_CACHE = 'PURGE_CACHE',
};

export enum ErrMessage {
  CANNOT_EDIT_TABS = 'Tabs cannot be edited right now (user may be dragging a tab).',
  NO_RECEIVER = 'Could not establish connection. Receiving end does not exist.',
}
export const ALARM_DELIMITER = '@';