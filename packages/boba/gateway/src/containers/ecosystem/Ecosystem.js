import React, { useEffect } from 'react'
import * as S from './Ecosystem.styles'
import Button from 'components/button/Button'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { ECOSYSTEM_CATEGORY } from 'util/constant'

function ECOSYSTEM() {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!params.category) {
      navigate(`/ecosystem/defi`)
    }
  }, [ params, navigate ]);

  return (
    <S.EcoSystemPageContainer>
      <S.CategoryList>
        {ECOSYSTEM_CATEGORY.map((cat, i) => {
          return <Button
            key={i}
            onClick={() => {
              navigate(`/ecosystem/${cat}`)
            }}
            sx={{ textTransform: 'uppercase' }}
            variant={params.category === cat ? "contained" : "standard"}
            color="primary"
            size="small"
          >{cat}</Button>
        })}
      </S.CategoryList>
      <S.DividerLine />
      <S.ProjectListContainer container
        spacing={{ xs: 2, md: 2 }}
        columns={{ xs: 5, sm: 13, md: 13 }}
      >
        <Outlet />
      </S.ProjectListContainer>
    </S.EcoSystemPageContainer>
  )

}


export default React.memo(ECOSYSTEM);
