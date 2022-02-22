const experimentOptions = {
  1: [1000000, 1000],
  2: [100000, 10000],
  3: [10000, 100000],
  4: [1000, 1000000],
  5: [200, 5000000],
}

const buildSection = (section, test) => {
  const shardList = [];
  const shardAddingList = [];
  for (let i = 1; i <= section; i++) {
    shardList.push(`shard${i}`);
    shardAddingList.push(`sh.addShard('shard${i}ReplicaSet/shard${i}:27017');`);
  }

  const sectionMarkup = `\
  - name: s0${section}t0${test}_init
    actions:
      - command: destroy
      - command: start
        vms: [configServer, client, mongos, ${shardList.join(', ')}]
      - command: setupHosts
        vms: [configServer, client, mongos, ${shardList.join(', ')}]
      - command: provision
        vms: [configServer, client, mongos, ${shardList.join(', ')}]
      - command: copy
        vms: client
        options:
          direction: in
          from: ./data/client
          to: /home/vagrant/client
      - command: exec
        vms: client
        options:
          command: cd /home/vagrant/client && npm i &
        description: Enable sharding on DB "test", Collection "items"
      - command: exec
        vms: mongos
        options:
          command: sudo bash -c "mongos --config /etc/mongos.conf"
        description: Starting mongos
      - command: exec
        vms: mongos
        options:
          command: mongo --eval "${shardAddingList.join(' ')}"
        description: Adding shard
      - command: exec
        vms: mongos
        options:
          command: |
            mongo "admin" --quiet --eval "sh.enableSharding('test'); sh.shardCollection('test.items', { shardKey: 'hashed' })"
        description: Enable sharding on DB "test", Collection "items"
  - name: s0${section}t0${test}_disklimit
    actions:
      - command: restart
        vms: [${shardList.join(', ')}]
  - name: s0${section}t0${test}_experiment
    actions:
      - command: exec
        vms: client
        options:
          command: cd /home/vagrant/client && node experiment.js ${experimentOptions[test].join(' ')}
  - name: s0${section}t0${test}_report
    actions:
      - command: report
        vms: [client, mongos, ${shardList.join(', ')}]
        options:
          start: s0${section}t0${test}_experiment
          end: s0${section}t0${test}_experiment
          labels: [CPU, MEM, DSK]
      - command: copy
        vms: client
        options:
          direction: out
          from: /home/vagrant/client/report.txt
          to: ./data/s0${section}t0${test}.txt
`
  return sectionMarkup;
}

let stages = '';

for (let i = 1; i <= 5; i++) {
  for (let j = 1; j <= 5; j++) {
    stages += buildSection(i, j);
  }
}

console.log(stages);