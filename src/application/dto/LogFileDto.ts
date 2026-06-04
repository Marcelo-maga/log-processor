export interface LogFileDto {
  request: Request;
  upstream_uri: string;
  response: Response;
  authenticated_entity: AuthenticatedEntity;
  route: Route;
  service: Service2;
  latencies: Latencies;
  client_ip: string;
  started_at: number;
}

export interface Request {
  method: string;
  uri: string;
  url: string;
  size: string;
  querystring: Querystring;
  headers: Headers;
}

export type Querystring = object;

export interface Headers {
  accept: string;
  host: string;
  'user-agent': string;
}

export interface Response {
  status: number;
  size: string;
  headers: Headers2;
}

export interface Headers2 {
  'Content-Length': string;
  via: string;
  Connection: string;
  'access-control-allow-credentials': string;
  'Content-Type': string;
  server: string;
  'access-control-allow-origin': string;
}

export interface AuthenticatedEntity {
  consumer_id: {
    uuid: string;
  };
}

export interface Route {
  created_at: number;
  hosts: any;
  id: string;
  methods: string[];
  paths: string[];
  preserve_host: boolean;
  protocols: string[];
  regex_priority: number;
  service: Service;
  strip_path: boolean;
  updated_at: number;
}

export interface Service {
  id: string;
}

export interface Service2 {
  connect_timeout: number;
  created_at: number;
  host: string;
  id: string;
  name: string;
  path: string;
  port: number;
  protocol: string;
  read_timeout: number;
  retries: number;
  updated_at: number;
  write_timeout: number;
}

export interface Latencies {
  proxy: number;
  gateway: number;
  request: number;
}
