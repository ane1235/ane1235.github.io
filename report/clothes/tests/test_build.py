import copy
import csv
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('clothes_build', ROOT/'build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class CSVBuildTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name)/'source'; self.source.mkdir()
        self.output = Path(self.temp.name)/'output'
        for name in ('models.csv','sizes.csv'):
            with (ROOT/name).open(newline='') as f:
                reader = csv.DictReader(f); headers = reader.fieldnames
                rows = [row for row in reader if row['model_id'] in ('hyperops', 'spaver')]
            self.write(name, headers, rows)

    def read(self, name):
        with (self.source/name).open(newline='',encoding='utf-8-sig') as f:
            reader=csv.DictReader(f);return reader.fieldnames,list(reader)

    def write(self, name, headers, rows):
        with (self.source/name).open('w',newline='',encoding='utf-8-sig') as f:
            writer=csv.DictWriter(f,fieldnames=headers);writer.writeheader();writer.writerows(rows)

    def test_join_alias_and_numeric_values(self):
        items=build.load_csv(self.source)
        self.assertEqual(len(items),2)
        self.assertEqual([r['size'] for r in items[1]['sizes']],['M','L','XL','XXL'])
        self.assertEqual(items[0]['sizes'][3]['alias'],'XXL')
        self.assertEqual(items[0]['sizes'][3]['chest'],61.5)
        self.assertNotIn('hem',items[1]['sizes'][0])
        self.assertIn('접속 오류',items[1]['requestedSourceStatus'])

    def test_new_model_never_creates_new_html(self):
        build.build(self.source,self.output)
        original={str(p.relative_to(self.output)) for p in self.output.rglob('*.html')}
        headers,rows=self.read('models.csv'); row=copy.deepcopy(rows[1]);row.update(model_id='spaver-second',model_name='두 번째 모델',source_note='쉼표, "인용"\n둘째 줄 | <태그>');rows.append(row);self.write('models.csv',headers,rows)
        headers,rows=self.read('sizes.csv');new=copy.deepcopy(rows[-1]);new.update(model_id='spaver-second',size='01',size_alias='S');rows.append(new);self.write('sizes.csv',headers,rows)
        build.build(self.source,self.output)
        self.assertEqual(original,{str(p.relative_to(self.output)) for p in self.output.rglob('*.html')})
        data=json.loads((self.output/'data.json').read_text())
        self.assertEqual(data[-1]['sizes'][0]['size'],'01')
        self.assertEqual(data[-1]['sourceNote'],'쉼표, "인용"\n둘째 줄 | <태그>')
        self.assertIn('&#124; &lt;태그&gt;',(self.output/'DATABASE.md').read_text())
        self.assertIn('두 번째 모델',(self.output/'static.html').read_text())
        self.assertFalse((self.output/'items/spaver-second').exists())
        snapshot={str(p):p.read_bytes() for p in self.output.rglob('*') if p.is_file()}
        build.build(self.source,self.output)
        self.assertEqual(snapshot,{str(p):p.read_bytes() for p in self.output.rglob('*') if p.is_file()})

    def test_reject_invalid_before_writes(self):
        mutations=[('models.csv','model_id','../bad'),('models.csv','checked_at','2026-02-30'),('models.csv','model_url','javascript:alert(1)'),('sizes.csv','model_id','missing'),('sizes.csv','shoulder','NaN'),('sizes.csv','chest','-1')]
        for name,key,value in mutations:
            with self.subTest(key=key,value=value):
                original=(self.source/name).read_bytes();headers,rows=self.read(name);rows[0][key]=value;self.write(name,headers,rows)
                with self.assertRaises(ValueError): build.build(self.source,self.output)
                self.assertFalse(self.output.exists())
                (self.source/name).write_bytes(original)

    def test_duplicate_size(self):
        headers,rows=self.read('sizes.csv');rows.append(rows[0]);self.write('sizes.csv',headers,rows)
        with self.assertRaises(ValueError):build.load_csv(self.source)


if __name__ == '__main__': unittest.main()
