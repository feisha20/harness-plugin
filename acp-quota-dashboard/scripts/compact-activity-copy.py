#!/usr/bin/env python3
"""生成活动详情压缩副本：源库只读，保留全部修订，禁止覆盖目标文件。"""
import argparse
from contextlib import closing
import hashlib
import json
import pathlib
import sqlite3
import zlib

MAGIC = b'ACPD1'


def encode(value):
    if not isinstance(value, str):
        return value, None
    raw = value.encode('utf-8')
    if len(raw) < 1024 or len(raw) > 4 * 1024 * 1024:
        return value, None
    compressed = MAGIC + zlib.compress(raw, level=1)
    if len(compressed) >= len(raw) * 0.9:
        return value, None
    assert zlib.decompress(compressed[len(MAGIC):]) == raw
    return None, compressed


def digest(db):
    result = hashlib.sha256()
    columns = [row[1] for row in db.execute('PRAGMA table_info(activity_journal)')]
    count = 0
    for row in db.execute('SELECT * FROM activity_journal ORDER BY dsh_session_id, revision_seq'):
        record = dict(zip(columns, row))
        for name in ('raw_detail', 'display_detail'):
            packed = record.pop(name + '_z', None)
            if packed is not None:
                if not packed.startswith(MAGIC):
                    raise ValueError('活动详情编码无效')
                record[name] = zlib.decompress(packed[len(MAGIC):]).decode('utf-8')
        result.update(json.dumps(record, ensure_ascii=False, sort_keys=True).encode('utf-8'))
        result.update(b'\n')
        count += 1
    return count, result.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    source = pathlib.Path(args.source).resolve(strict=True)
    output = pathlib.Path(args.output).resolve()
    # 独占创建且仅本用户可读；不接触运行中源库的 WAL 或配置。
    with output.open('xb'):
        output.chmod(0o600)
    try:
        with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)) as original, closing(sqlite3.connect(output)) as db:
            original.backup(db)
            before = digest(db)
            columns = {row[1] for row in db.execute('PRAGMA table_info(activity_journal)')}
            for column in ('raw_detail_z', 'display_detail_z'):
                if column not in columns:
                    db.execute(f'ALTER TABLE activity_journal ADD COLUMN {column} BLOB')
            changed = 0
            cursor = db.execute('SELECT dsh_session_id, revision_seq, raw_detail, display_detail FROM activity_journal')
            while rows := cursor.fetchmany(200):
                for session, revision, raw, display in rows:
                    raw_text, raw_z = encode(raw)
                    display_text, display_z = encode(display)
                    if raw_z is None and display_z is None:
                        continue
                    db.execute('''UPDATE activity_journal SET raw_detail=?, display_detail=?,
                        raw_detail_z=COALESCE(?,raw_detail_z), display_detail_z=COALESCE(?,display_detail_z)
                        WHERE dsh_session_id=? AND revision_seq=?''',
                        (raw_text, display_text, raw_z, display_z, session, revision))
                    changed += 1
            db.commit()
            if digest(db) != before:
                raise RuntimeError('压缩前后历史内容不一致')
            db.execute('PRAGMA journal_mode=DELETE')
            db.execute('VACUUM')
            if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('副本完整性检查失败')
        print(json.dumps({'output': str(output), 'revisions': before[0], 'compressed_rows': changed,
                          'history_sha256': before[1], 'bytes': output.stat().st_size}, ensure_ascii=False))
    except BaseException:
        output.unlink(missing_ok=True)
        raise


if __name__ == '__main__':
    main()
